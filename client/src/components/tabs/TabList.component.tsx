import { cloneDeep, random } from 'lodash';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { iTab } from '../../../../shared/types.shared';
import { ClientApiContext, getApi } from '../../hooks/api/api.hook';
import { onTabUpdateFn } from '../../hooks/app/tabs.hook';
import { deviceType } from '../../managers/device.manager';
import { strings } from '../../managers/strings.manager';
import { cssVars } from '../../managers/style/vars.style.manager';
import { Icon } from '../Icon.component';

// export const TabList = React.memo((p: {
export const TabList = (p: {
	tabs: iTab[]
	onUpdate: onTabUpdateFn
}) => {

	const api = useContext(ClientApiContext);

	const [dragId, setDragId] = useState(-1)

	return (
		<div className="tab-list-scroll-wrapper">
			<div className="tab-list-invisible-scroll">
				<div className="tab-list-wrapper">
					{/* ALL TABS LIST*/}
					{p.tabs.map((tab, i) =>
						<Tab
							key={i}
							tab={tab}


							onDrop={pos => { setDragId(pos) }}
							onDragEnter={pos => { setDragId(pos) }}
							onDragEnd={pos => {
								api && api.tabs.reorder(pos, dragId)
								setDragId(-1)
							}}
							dragIndic={dragId}
							pos={i}

							onUpdate={p.onUpdate}
						/>
					)}

					{/* ADD NEW TAB BUTTON*/}
					{api?.ui.browser.files.active.get &&

						<div
							className="tab-wrapper tab-more"
							onClick={e => {
								p.onUpdate('add')
							}}
						>
							+
						</div>
					}

				</div>
			</div>
		</div>
	)

}

// }, (np, pp) => {
// 	if (JSON.stringify(np.tabs) !== JSON.stringify(pp.tabs)) return false
// 	return true
// })



const Tab = React.memo((p: {
	tab: iTab
	onUpdate: onTabUpdateFn

	onDragEnter: Function
	onDragEnd: Function
	onDrop: Function

	pos: number
	dragIndic: number
}) => {
	const { tab, pos } = { ...p }

	let iconName = `Six`
	const nbLay = tab.grid.layout.length
	if (nbLay === 2) iconName = 'Two'
	if (nbLay === 3) iconName = 'Three'
	if (nbLay === 4) iconName = 'Four'
	if (nbLay === 5) iconName = 'Five'
	iconName = `faDice${iconName}`

	return (
		<div className="tab-and-drag-wrapper">
			{
				p.dragIndic === pos && <div className="drag-indic">
					▼
				</div>
			}
			<div
				className={`tab-wrapper ${tab.active ? 'active' : ''}`}
				draggable={true}
				onDragEnter={() => { p.onDragEnter(pos) }}
				onDrop={() => { p.onDrop(pos) }}
				onDragEnd={() => { p.onDragEnd(pos) }}
			>

				<div className="active-ribbon"></div>
				<div className="tab-name"
					onClick={() => { p.onUpdate('activate', tab) }}
				>

					{deviceType() !== 'mobile' &&
						< input
							type="text"
							className="tab-input-text"
							value={tab.name}
							style={{ width: tab.name.length * 10 + "px" }}
							onChange={e => {
								p.onUpdate('rename', tab, e.target.value)
							}}
						/>
					}
					{deviceType() === 'mobile' &&
						<>{tab.name}</>
					}


				</div>


				{
					tab.grid.layout.length > 1 &&
					<div
						className="tab-nb-windows"
						onClick={() => { p.onUpdate('activate', tab) }}
					>
						<Icon name={iconName} color={`#b2b2b2`} />
					</div>
				}

				< div className="tab-close"
					onClick={() => {
						getApi(api => {
							api.popup.confirm(
								`${strings.deleteTabPrompt} "${tab.name}"?`, () => {
									p.onUpdate('close', tab)
								});
						})
					}}
				>
					<Icon name="faPlus" color={`#b2b2b2`} />
				</div>
			</div >
		</div >
	)
}, (np, pp) => {
	let res = true


	// 1. only compare tab struct, not content/layout
	const t: any = cloneDeep({ n: np.tab, p: pp.tab })
	t.n.grid = t.p.grid = {}
	t.n.refresh = t.p.refresh = ""
	let t1 = JSON.stringify(t.p)
	let t2 = JSON.stringify(t.n)
	if (t1 !== t2) res = false


	// 2. 
	if (pp.pos !== np.pos) res = false
	if (pp.dragIndic !== np.dragIndic) res = false
	if (pp.tab.active !== np.tab.active) res = false

	// 3.
	// if (pp.tab.grid.content[0]?.file?.name !== np.tab.grid.content[0]?.file?.name) res = false
	if (pp.onUpdate !== np.onUpdate) res = false
	// console.log(1, res);
	// // console.log(2, t);
	// let t1 = JSON.stringify(t.p)
	// let t2 = JSON.stringify(t.n)

	// if (t1 !== t2) res = false
	// if (pp.pos !== np.pos) res = false
	// if (pp.dragIndic !== np.dragIndic) res = false
	return res
})

export const tabsCss = () => `
.tab-list-scroll-wrapper {
		height: 44px;
		background: ${cssVars.colors.bgTabs};
    border-radius: 0px 0px 0px 5px;
		overflow: hidden;
		.tab-list-invisible-scroll {
				width: 100%;
				overflow-x: scroll;
				padding-bottom: 18px;
				.tab-list-wrapper {
						padding: 7px 0px 0px 13px;
						display: flex;
						background: ${cssVars.colors.bgTabs};
						border-radius: 0px 0px 0px 5px;
						position: relative;
						&>div:last-child {
								margin-right: 30px;
						}
						.tab-and-drag-wrapper {
								position:relative;
								.drag-indic {
										z-index: 2;
										position: absolute;
										top: -8px;
										left: -6px;
										width: 20px;
										height: 20px;
										color: #aaaaaa;
										font-size: 8px;
								}
						}
						.tab-wrapper {
								position: relative;
								align-items:center;
								display:flex;
								margin-right: 5px;
								padding: 5px;
								background: ${cssVars.colors.bgTab};
								display: flex;
								color: ${cssVars.colors.fontTab};
								font-family: ${cssVars.font.editor};
								height: 35px;
								box-shadow:rgb(0 0 0 / 20%) 0px -1px 2px ;
								border-radius: 5px 5px 0px 0px;
								justify-content: space-between;
								max-height: 27px;
								overflow: hidden;
								text-align: center;
								.tab-nb-windows {
										margin-left: 10px;
								}
								.active-ribbon {
										position: absolute;
										top: 0px;
										left: 0px;
										width: 100%;
										height: 2px;
								}
								&.active {
										.active-ribbon {
												background: ${cssVars.colors.main};
										}

										background: ${cssVars.colors.bgTabActive};
										font-weight: bold
								}
								&.tab-more {
										min-width: 30px;
										width: 30px;
										max-width: 30px;
										cursor: pointer;
										font-weight: bold;
										font-family: ${cssVars.font.main};
										display:flex;
										width: 100%;
										font-size:14px;
										justify-content: center;
								}
								.tab-name {
										padding: 10px 0px 10px 10px;

										input {
												color:${cssVars.colors.fontTab} ;
												font-size: 11px;
												background: none;
												border: none;
												min-width: 30px;
												max-width: 100px;
												font-weight: 400;
												font-family: ${cssVars.font.editor};
										}

								}
								.tab-nb-windows {
										padding: 10px 0px 10px 0px;

								}
								.tab-close {
										cursor: pointer;
										margin-left: 5px;
										transform: rotate(45deg);
										cursor: pointer;
										margin-left: 5px;
										padding: 5px;
										font-weight: bold;
										font-family: ${cssVars.font.main};
								}
						}
				}
		}
}
`
