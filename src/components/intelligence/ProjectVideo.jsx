import { projectVideo } from "../../utils/projectVideo";
import { imageSources } from "../../utils/imageSources";
import { useState } from "react";
export default function ProjectVideo({
  source,
  title,
  poster,
  onError,
  className = "",
  label,
}) {
  const video = projectVideo(source);
  const [preview, setPreview] = useState(false);
  if (!video) return null;
  return preview && video.type === "drive" ? (
    <iframe
      className={`project-demo-video project-video-embed ${className}`}
      src={video.preview}
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
      onError={() => {
        if (video.type === "drive") setPreview(true);
        else onError?.();
      }}
    />
  );
}
