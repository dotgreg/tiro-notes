import React, { useEffect, useRef }  from 'react';

export const Input = (p:{
    id?:string
    label?:string
    type?:'password'|'text'
    explanation?:string
    value: string
    onChange: (res:string) => void
    onFocus?: Function
    onEnterPressed?: Function
    shouldFocus?:boolean
}) => {
    const inputRef = useRef<any>()
    useEffect(() => {
        if (p.shouldFocus) {
            inputRef.current.focus()
        }
    }, [])

    return (
        <div className={`input-component ${p.id ? p.id : ''}` }>
            
            {
                p.label && <span>{p.label} :</span>
            }
            <div className="input-wrapper">
                <input 
                    ref={inputRef}
                    type={p.type ? p.type : 'text'} 
                    value={p.value} 
                    onFocus={() => { p.onFocus && p.onFocus() }}
                    onClick={() => {inputRef.current.select()}}
                    onKeyPress={e => {
                        // @ts-ignore
                        var keyCode = e.code || e.key;
                        if (keyCode == 'Enter' && p.onEnterPressed) p.onEnterPressed()
                    }}
                    onChange={(e) => {
                        p.onChange(e.target.value)
                    }} />
                
                { p.explanation && <div className="explanation"> {p.explanation} </div>}
            </div>
        </div>
    )
}

export const inputComponentCss = `
    .input-component {
        display: flex;
        align-items: center;
        padding-bottom: 10px;
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