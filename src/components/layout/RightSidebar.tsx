import React from "react";
import { Box } from "@mui/material";

const RightSidebar: React.FC = () => {

  return (
    <Box
      sx={{
        position: "sticky",
        top: { xs: 56, sm: 64 },
        height: { xs: "calc(100vh - 56px)", sm: "calc(100vh - 64px)" },
        overflowY: "auto",
        overflowX: "hidden",
        display: { xs: "none", lg: "block" },
        width: { lg: 300, xl: 320 },
        minWidth: { lg: 300, xl: 320 },
        p: 2,
        flexShrink: 0,
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: '4px',
        },
      }}
    >
      {/* Right sidebar content removed */}
    </Box>
  );
};

export default RightSidebar;
