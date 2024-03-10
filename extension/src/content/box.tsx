import React, { useState, useEffect, useRef } from "react";

interface Position {
  x: number;
  y: number;
}

export const TextboxComponent = () => {
  const [text, setText] = useState<string>("...");
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const componentRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging) {
        const dx = event.clientX - dragStart.x;
        const dy = event.clientY - dragStart.y;
        setPosition((prevPosition) => ({
          x: prevPosition.x + dx,
          y: prevPosition.y + dy,
        }));
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
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart]);

  useEffect(() => {
    const messageListener = async (
      request: { action: string; content?: string },
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: string) => void
    ) => {
      if (request.action === "grabSelectedText") {
        const selectedText = window.getSelection()?.toString();
        sendResponse(selectedText);
        show();
        setText("loading...");
        return true;
      }
      if (request.action === "dispLLMOutput") {
        show();
        setText(request.content || "");
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

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (!target.classList.contains("resizable")) {
      setIsDragging(true);
      setDragStart({
        x: event.clientX,
        y: event.clientY,
      });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
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
      className={` ${
        isVisible
          ? " fixed z-50 block shadow-lg rounded-lg resizable"
          : "hidden"
      } `}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: "move",
        backgroundColor: "#2C3E50", // Light dark blue background
        resize: "both",
        overflow: "hidden", // Changed to 'hidden' to ensure overflow from content does not escape the container
        display: "flex",
        flexDirection: "column", // This makes sure that the textarea and the button div are laid out in a column
      }}
    >
      <textarea
        value={text}
        onChange={handleChange}
        className="form-textarea mt-1 block w-full h-32 p-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm rounded-md"
        style={{
          resize: "none", // Disable textarea resizing
          color: "#CAD3C8",
          backgroundColor: "transparent",
          border: "none", // Remove the border by setting it to 'none'
          flex: "1", // Make textarea flexible to fill available space, leaving just enough for the buttons
        }}
      />
      <div className="flex justify-end mt-2">
        <div className="space-x-2">
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
    </div>
  );
};
