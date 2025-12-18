import React, { useState } from "react";
import { Box, Skeleton, useMediaQuery, useTheme } from "@mui/material";

interface PostImageProps {
  src: string;
  alt?: string;
  onClick?: () => void;
}

/**
 * Standardized post image component that handles all aspect ratios nicely.
 * - Uses a consistent container with aspect-ratio for uniform display
 * - Shows images with object-fit: contain to preserve full image visibility
 * - Adds a subtle background for images that don't fill the container
 */
const PostImage: React.FC<PostImageProps> = ({ src, alt = "Post image", onClick }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (error) {
    return null;
  }

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
        cursor: onClick ? "pointer" : "default",
        // Standardized aspect ratio container - 4:3 works well for most content
        aspectRatio: isMobile ? "4/3" : "16/10",
        maxHeight: isMobile ? 280 : 400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform 0.2s ease",
        "&:hover": onClick ? {
          transform: "scale(1.005)",
          "& img": {
            transform: "scale(1.02)",
          },
        } : {},
      }}
      onClick={onClick}
    >
      {/* Loading skeleton */}
      {!loaded && (
        <Skeleton
          variant="rectangular"
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            borderRadius: 2,
          }}
          animation="wave"
        />
      )}

      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          width: "auto",
          height: "auto",
          objectFit: "contain",
          borderRadius: 8,
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.3s ease, transform 0.2s ease",
        }}
      />
    </Box>
  );
};

export default PostImage;
