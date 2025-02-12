import React from 'react';
import ReactDOM from 'react-dom';

const Modal = ({ children, onClose }) => {
  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-primary flex justify-center items-center z-[9999]"
      onClick={onClose} 
    >
      <div
        className="bg-tertiary p-6 rounded-md max-w-3xl w-full relative overflow-auto max-h-[80vh]"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-red-700 font-bold text-xl"
        >
          &times;
        </button>
        {children}
      </div>
    </div>,
    document.getElementById('modal-root') // This is where the modal will be rendered.
  );
};

export default Modal;
