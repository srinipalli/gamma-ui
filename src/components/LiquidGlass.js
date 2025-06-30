"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"

const LiquidGlass = ({ 
  children, 
  variant = "default", 
  intensity = "medium", 
  isDarkMode = false, 
  className = "",
  onClick,
  ...props 
}) => {
  const [isHovering, setIsHovering] = useState(false)
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)

  const handleMouseMove = (e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setCursorPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }

  const handleMouseEnter = (e) => {
    setIsHovering(true)
    handleMouseMove(e)
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
  }

  const getIntensityClasses = () => {
    switch (intensity) {
      case "subtle":
        return `backdrop-blur-sm ${
          isDarkMode 
            ? "bg-gray-800/40 border-gray-600/40" 
            : "bg-white/70 border-gray-300/50 shadow-sm"
        }`
      case "strong":
        return `backdrop-blur-3xl ${
          isDarkMode 
            ? "bg-gray-800/80 border-gray-600/40" 
            : "bg-white/85 border-gray-300/60 shadow-lg"
        }`
      case "ultra":
        return `backdrop-blur-[40px] ${
          isDarkMode 
            ? "bg-gray-800/90 border-gray-600/40" 
            : "bg-white/95 border-gray-300/70 shadow-xl"
        }`
      default:
        return `backdrop-blur-xl ${
          isDarkMode 
            ? "bg-gray-800/60 border-gray-600/40" 
            : "bg-white/80 border-gray-300/60 shadow-md"
        }`
    }
  }

  const getVariantClasses = () => {
    const baseClasses = `liquid-glass relative overflow-hidden ${
      isDarkMode ? "" : "shadow-sm hover:shadow-md"
    }`
    
    switch (variant) {
      case "button":
        return `${baseClasses} cursor-pointer select-none transition-all duration-300 hover:scale-[1.02] ${
          isDarkMode ? "" : "hover:shadow-lg"
        }`
      case "card":
        return `${baseClasses} transition-all duration-300 hover:scale-[1.01] ${
          isDarkMode ? "" : "hover:shadow-lg"
        }`
      case "panel":
        return `${baseClasses} ${isDarkMode ? "" : "shadow-md"}`
      default:
        return baseClasses
    }
  }

  return (
    <div
      ref={containerRef}
      className={`
        ${getVariantClasses()}
        ${getIntensityClasses()}
        border rounded-2xl
        ${className}
      `}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      {...props}
    >
      {/* Liquid Glass Effect - Only on Hover */}
      {isHovering && (
        <motion.div
          className="absolute pointer-events-none"
          style={{
            left: cursorPos.x - 60, // Center the 120px width
            top: cursorPos.y - 60,  // Center the 120px height
            width: "120px",
            height: "120px",
            background: isDarkMode 
              ? "radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 30%, transparent 70%)"
              : "radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, rgba(59, 130, 246, 0.12) 30%, rgba(147, 197, 253, 0.08) 50%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(15px)",
            zIndex: 2,
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Shimmer Effect - Only on Hover */}
      {isHovering && (
        <div className={`absolute inset-0 ${
          isDarkMode 
            ? "bg-gradient-to-br from-white/5 via-transparent to-transparent" 
            : "bg-gradient-to-br from-blue-200/20 via-white/10 to-transparent"
        } pointer-events-none z-5 rounded-2xl`} />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

export default LiquidGlass
