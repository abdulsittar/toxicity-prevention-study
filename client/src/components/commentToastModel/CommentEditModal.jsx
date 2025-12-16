import { Dialog, DialogTitle, DialogContent, DialogActions, Typography } from "@mui/material";
import { Button, TextField } from "@mui/material";
import { useState, useEffect } from "react";

export default function CommentEditModal({
  open,
  defaultValue = "",
  feedback = "", // new prop for feedback text
  onSubmit,
  onClose
}) {
  const [value, setValue] = useState(defaultValue);

  // Reset text when modal opens
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const handleSend = () => {
    if (!value.trim()) return;
    onSubmit(value); // call parent's onSubmit with edited text
    onClose();       // close the modal
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit your comment</DialogTitle>

      <DialogContent>
        {/* Editable field */}
        <TextField
          fullWidth
          multiline
          autoFocus
          minRows={3}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          margin="normal"
        />

        {/* Feedback text */}
        {feedback && (
          <div style={{ marginTop: '12px' }}>
            <Typography variant="subtitle2" color="textSecondary">
              Feedback:
            </Typography>
            
            {typeof feedback === "object" ? (
      <div
        style={{
          backgroundColor: "#f5f5f5",
          padding: "10px",
          borderRadius: "6px",
          lineHeight: "1.6"
        }}
      >
        {Object.entries(feedback).map(([key, value]) => (
          <div key={key} style={{ marginBottom: "8px" }}>
            <strong>{key}:</strong> {value}
          </div>
        ))}
      </div>
    ) : (
      <Typography
        variant="body2"
        color="textSecondary"
        style={{
          whiteSpace: "pre-wrap",
          backgroundColor: "#f5f5f5",
          padding: "8px",
          borderRadius: "4px"
        }}
      >
        {feedback}
      </Typography>
        )}
  </div>
  )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSend}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
