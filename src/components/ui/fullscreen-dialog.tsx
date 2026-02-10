import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './dialog';

interface FullscreenDialogProps {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  preventClose?: boolean;
}

const FullscreenDialog: React.FC<FullscreenDialogProps> = ({
  open,
  title,
  description,
  children,
  preventClose = true,
}) => (
  <Dialog open={open}>
    <DialogContent
      size="fullscreen"
      className="flex items-center justify-center border-0 bg-[var(--color-text)]/40 p-4 backdrop-blur-sm sm:p-8"
      onEscapeKeyDown={(event) => {
        if (preventClose) event.preventDefault();
      }}
      onPointerDownOutside={(event) => {
        if (preventClose) event.preventDefault();
      }}
      onInteractOutside={(event) => {
        if (preventClose) event.preventDefault();
      }}
    >
      <div className="w-full max-w-2xl">
        <DialogHeader className="mb-6 text-center">
          <DialogTitle className="font-display text-3xl sm:text-4xl">{title}</DialogTitle>
          {description && <DialogDescription className="text-base">{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </div>
    </DialogContent>
  </Dialog>
);

export default FullscreenDialog;
