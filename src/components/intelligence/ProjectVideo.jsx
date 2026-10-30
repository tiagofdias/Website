import { projectVideo } from "../../utils/projectVideo";
import { imageSources } from "../../utils/imageSources";
export default function ProjectVideo({
  source,
  title,
  poster,
  onError,
  className = "",
  label,
}) {
  const video = projectVideo(source);
  if (!video) return null;
  return video.type === "embed" ? (
    <iframe
      className={`project-demo-video project-video-embed ${className}`}
      src={video.src}
      title={label || `${title} demo video`}
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
    />
  ) : (
    <video
      className={`project-demo-video ${className}`}
      src={video.src}
      poster={imageSources(poster)[0]}
      autoPlay
      muted
      playsInline
      loop
      controls
      preload="metadata"
      aria-label={label || `${title} demo video`}
      onError={onError}
    />
  );
}
