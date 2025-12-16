import { toast } from "react-toastify";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import React, { useState } from "react";

// Component rendered inside toast
function CommentToast({ onSubmit, onCancel, defaultValue = "" }) {
  const [value, setValue] = useState(defaultValue);

  const handleSend = () => {
    if (value.trim()) {
      onSubmit(value);
      toast.dismiss(); // close toast after submit
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    toast.dismiss(); // just close the toast
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <TextField
        label="Reply here..."
        variant="outlined"
        size="small"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
        <Button
          variant="outlined"
          color="secondary"
          size="small"
          onClick={handleCancel}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          size="small"
          color="primary"
          onClick={handleSend}
        >
          Send
        </Button>
      </div>
    </div>
  );
}

// Function to call toast
export function showCommentToast(onSubmit, defaultValue = "", onCancel) {

  // CREATE OVERLAY
  let overlay = document.createElement("div");
  overlay.className = "toast-screen-overlay";
  document.body.appendChild(overlay);

  toast.info(
    <CommentToast
      onSubmit={(value) => {
        removeOverlay();
        onSubmit(value);
      }}
      onCancel={() => {
        removeOverlay();
        if (onCancel) onCancel();
      }}
      defaultValue={defaultValue}
    />,
    {
      position: "top-center",
      autoClose: false,
      hideProgressBar: true,
      closeOnClick: false,
      draggable: false,
      closeButton: false,
    }
  );

  function removeOverlay() {
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }
}


