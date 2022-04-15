import React, { useRef, useState, useEffect } from 'react'

const quickAndDirtyStyle = {
	width: "200px",
	height: "200px",
	background: "#FF9900",
	color: "#FFFFFF",
	display: "flex",
	justifyContent: "center",
	alignItems: "center"
}

const DraggableComponent = ({ children }) => {
	const [pressed, setPressed] = useState(false)
	const [position, setPosition] = useState({ x: 0, y: 0 })
	const ref = useRef<any>()

	// Monitor changes to position state and update DOM
	useEffect(() => {
		if (ref.current) {
			ref.current.style.transform = `translate(${position.x}px, ${position.y}px)`
		}
	}, [position])

	// Update the current position if mouse is down
	const onMouseMove = (event) => {
		if (pressed) {
			setPosition({
				x: position.x + event.movementX,
				y: position.y + event.movementY
			})
		}
	}

	return (
		<div
			ref={ref}
			onMouseMove={onMouseMove}
			onMouseDown={() => setPressed(true)}
			onMouseUp={() => setPressed(false)}>
{children}
		</div>
	)
}

export default DraggableComponent
