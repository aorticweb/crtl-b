import React, { useState, useEffect, useRef } from 'react';

export const TextboxComponent = () => {
  const [text, setText] = useState('...');
  const [isVisible, setIsVisible] = useState(false);
  const componentRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({x: 0, y: 0});
  const [dragStart, setDragStart] = useState({x: 0, y: 0});

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (isDragging) {
        const dx = event.clientX - dragStart.x;
        const dy = event.clientY - dragStart.y;
        setPosition({
          x: position.x + dx,
          y: position.y + dy,
        });
        setDragStart({
          x: event.clientX,
          y: event.clientY,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, position]);

  useEffect(() => {
    const messageListener = async (request, sender, sendResponse) => {
      if (request.action === "grabSelectedText") {
        const selectedText = window.getSelection()?.toString();
        sendResponse(selectedText);
        show();
        setText("loading...");
        return true;
      }
      if (request.action === "dispLLMOutput") {
        show();
        setText(request.content);
        sendResponse("content was displayed");
        return true;
      }
      if (request.action === "dispLLMFailure") {
        show();
        setText("failed to perform LLM Task");
        sendResponse("error message was displayed");
        return true;
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const handleMouseDown = (event: any) => {
    setIsDragging(true);
    setDragStart({
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
  };

  const handleChange = (event: any) => {
    setText(event.target.value);
  };

  const hide = () => {
    setIsVisible(false);
  };

  const show = () => {
    setIsVisible(true);
  };

  return (
    <div
      ref={componentRef}
      onMouseDown={handleMouseDown}
      className={`fixed z-50 ${isVisible ? 'block' : 'hidden'} p-6 shadow-lg rounded-lg`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: 'move',
        backgroundColor: '#2C3E50', // Light dark blue background
      }}
    >
      <textarea
        value={text}
        onChange={handleChange}
        className="form-textarea mt-1 block w-full h-32 p-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm rounded-md"
        style={{
          color: '#CAD3C8',
          backgroundColor: 'transparent',
          borderColor: '#CAD3C8'
        }}
      />
      <div className="flex justify-between space-x-2 mt-2">
        <button
          onClick={handleCopy}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-full cursor-pointer"
        >
          Copy
        </button>
        <button
          onClick={hide}
          className="inline-flex items-center justify-center px-4 py-2 bg-red-500 hover:bg-red-700 text-white font-medium rounded-full cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );  
};
