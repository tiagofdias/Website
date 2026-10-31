const {
  randomBytes,
  scrypt,
  timingSafeEqual,
  createHash,
} = require("node:crypto");
const { promisify } = require("node:util");
const derive = promisify(scrypt);
const ACCOUNT_ID = "portfolio-admin";
const options = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
class AccountError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = await derive(password, salt, 64, options);
  return `scrypt$32768$8$1$${salt}$${hash.toString("hex")}`;
}
async function verifyPassword(password, encoded) {
  if (typeof password !== "string" || password.length > 1024) return false;
  const match = /^scrypt\$32768\$8\$1\$([a-f0-9]{32})\$([a-f0-9]{128})$/.exec(
    encoded || "",
  );
  if (!match) return false;
  const actual = await derive(password, match[1], 64, options);
  return timingSafeEqual(actual, Buffer.from(match[2], "hex"));
}
function sameSecret(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !a || !b) return false;
  return timingSafeEqual(
    createHash("sha256").update(a).digest(),
    createHash("sha256").update(b).digest(),
  );
}
function createAdminAccount({
  load,
  replace,
  bootstrapUsername,
  bootstrapPassword,
  signToken,
}) {
  async function account() {
    const saved = await load();
    if (saved) return { ...saved, bootstrap: false };
    if (!bootstrapUsername || !bootstrapPassword)
      throw new AccountError(503, "Admin sign-in is not configured.");
    return {
      username: bootstrapUsername,
      credentialVersion: 0,
      bootstrap: true,
    };
  }
  const identity = (record) => ({
    username: record.username,
    credentialVersion: record.credentialVersion,
  });
  const token = (record) =>
    signToken({
      sub: ACCOUNT_ID,
      username: record.username,
      credentialVersion: record.credentialVersion,
    });
  const verify = (password, record) =>
    record.bootstrap
      ? sameSecret(password, bootstrapPassword)
      : verifyPassword(password, record.passwordHash);
  return {
    async currentIdentity() {
      return identity(await account());
    },
    async issueToken() {
      return token(await account());
    },
    async login(username, password) {
      if (
        typeof username !== "string" ||
        typeof password !== "string" ||
        password.length > 1024
      )
        throw new AccountError(401, "Invalid credentials");
      const record = await account(),
        valid = await verify(password, record);
      if (!valid || username !== record.username)
        throw new AccountError(401, "Invalid credentials");
      return { token: token(record) };
    },
    async validSession(claims) {
      if (!claims || typeof claims !== "object") return false;
      const record = await account();
      return (
        (!claims.sub || claims.sub === ACCOUNT_ID) &&
        claims.username === record.username &&
        (claims.credentialVersion ?? 0) === record.credentialVersion
      );
    },
    async change(input = {}) {
      if (!input || typeof input !== "object" || Array.isArray(input))
        throw new AccountError(400, "Enter valid sign-in details.");
      if (input.username !== undefined && typeof input.username !== "string")
        throw new AccountError(400, "Enter a valid username.");
      const record = await account();
      const { currentPassword, newPassword = "", confirmPassword = "" } = input;
      const username =
        typeof input.username === "string"
          ? input.username.trim()
          : record.username;
      if (
        typeof currentPassword !== "string" ||
        !currentPassword ||
        currentPassword.length > 1024
      )
        throw new AccountError(
          400,
          "Enter your current password to confirm this change.",
        );
      if (!(await verify(currentPassword, record)))
        throw new AccountError(403, "Current password is incorrect.");
      if (!/^[\p{L}\p{N}._@-]{3,64}$/u.test(username))
        throw new AccountError(
          400,
          "Use 3–64 letters, numbers, dots, underscores, @ signs or hyphens for the username.",
        );
      if (
        typeof newPassword !== "string" ||
        typeof confirmPassword !== "string"
      )
        throw new AccountError(400, "Enter a valid new password.");
      if (
        newPassword &&
        (Array.from(newPassword).length < 12 ||
          Array.from(newPassword).length > 128)
      )
        throw new AccountError(400, "Use a password with 12–128 characters.");
      if (newPassword !== confirmPassword)
        throw new AccountError(400, "The new passwords do not match.");
      if (username === record.username && !newPassword)
        throw new AccountError(
          400,
          "Change your username or enter a new password.",
        );
      const next = {
        username,
        passwordHash: newPassword
          ? await hashPassword(newPassword)
          : record.passwordHash || (await hashPassword(currentPassword)),
        credentialVersion: record.credentialVersion + 1,
      };
      const renewed = token(next);
      if (!(await replace(record, next)))
        throw new AccountError(
          409,
          "Sign-in details changed in another session. Sign in again before retrying.",
        );
      return { username, token: renewed };
    },
  };
}
function createAttemptLimit({
  maximum = 10,
  windowMs = 15 * 60 * 1000,
  now = Date.now,
} = {}) {
  const attempts = new Map();
  return (req, res, next) => {
    const time = now(),
      key = req.ip || req.socket?.remoteAddress || "unknown";
    let entry = attempts.get(key);
    if (!entry || entry.until <= time) {
      for (const [key, value] of attempts)
        if (value.until <= time) attempts.delete(key);
      if (attempts.size >= 5000) {
        res.set("Retry-After", "60");
        return res
          .status(429)
          .json({ error: "Too many sign-in attempts. Try again later." });
      }
      entry = { count: 0, until: time + windowMs };
      attempts.set(key, entry);
    }
    if (entry.count >= maximum) {
      res.set("Retry-After", String(Math.ceil((entry.until - time) / 1000)));
      return res
        .status(429)
        .json({ error: "Too many sign-in attempts. Try again later." });
    }
    entry.count++;
    res.on("finish", () => {
      if (res.statusCode < 400 && attempts.get(key) === entry)
        attempts.delete(key);
    });
    next();
  };
}
module.exports = {
  ACCOUNT_ID,
  AccountError,
  hashPassword,
  verifyPassword,
  createAdminAccount,
  createAttemptLimit,
};
