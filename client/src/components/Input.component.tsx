import { isBoolean } from 'lodash';
import React, { useEffect, useRef } from 'react';

export type OptionObj = { key: number | string, label: string, obj: any }
export type InputType = 'password' | 'text' | 'select' | 'checkbox'

export const Input = (p: {
	id?: string
	label?: string
	type?: InputType
	list?: OptionObj[]
	explanation?: string
	value?: string | number | boolean
	onChange?: (res: string) => void
	onCheckedChange?: (res: boolean) => void
	onSelectChange?: (res: string) => void
	onFocus?: Function
	onEnterPressed?: Function
	shouldFocus?: boolean
	shouldNotSelectOnClick?: boolean
	readonly?: boolean
}) => {

	const inputRef = useRef<any>()
	const focusToInput = () => {
		if (p.shouldFocus) {
			inputRef.current.focus()
		}
	}


	useEffect(() => {
		focusToInput()
	}, [p.shouldFocus])
	useEffect(() => {
		focusToInput()
	}, [])

	let isChecked = p.type === "checkbox" && (p.value === true || p.value === 'true')
	let value = p.value
	if (isBoolean(value)) value = ""

	return (
		<div className={`input-component ${p.id ? p.id : ''} ${p.type}`}>

			{
				p.label && <span>{p.label} :</span>
			}
			<div className="input-wrapper">
				{p.type !== 'select' && <input
					ref={inputRef}
					type={p.type ? p.type : 'text'}
					value={value}
					checked={isChecked}
					readOnly={p.readonly}
					onFocus={() => { p.onFocus && p.onFocus() }}
					onClick={() => { !p.shouldNotSelectOnClick && inputRef.current.select() }}
					onKeyPress={e => {
						// @ts-ignore
						var keyCode = e.code || e.key;
						if (keyCode == 'Enter' && p.onEnterPressed) p.onEnterPressed()
					}}
					onChange={(e) => {
						p.onCheckedChange && p.onCheckedChange(e.target.checked)
						p.onChange && p.onChange(e.target.value)
					}} />}

				{p.type === 'select' &&
					<select
						value={value}
						onChange={(e) => {
							p.onSelectChange && p.onSelectChange(e.target.value)
						}}>

						{
							p.list?.map((opt, i) =>
								<option
									value={opt.key}
									selected={value === opt.key ? true : false}
								// selected={ i === 3 ? true : false}
								>{opt.label} </option>
							)
						}
					</select>
				}

				{p.explanation && <div className="explanation"> {p.explanation} </div>}
			</div>
		</div>
	)
}

export const inputComponentCss = () => `
    .input-component {
        display: flex;
        align-items: center;
        padding-bottom: 10px;
        input, select {
            max-width: 100%;
        }
        &.select {
            span {
                width: 20%;
            }
        }
        span {
            width: 30%;
            font-weight: 700;
            text-transform: uppercase;
        }
        .input-wrapper {
            width: 70%;
            input {
                padding: 7px;
                border: none;
                background: #ececec;
                border-radius: 5px;
            }
            .explanation {
                font-size: 11px;
                color: grey;
            }
        }
    }
`
