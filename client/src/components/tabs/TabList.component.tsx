import styled from '@emotion/styled';
import React, { useEffect, useRef, useState } from 'react';
import { iTab } from '../../../../shared/types.shared';
import { onTabUpdateFn } from '../../hooks/app/tabs.hook';
import { cssVars } from '../../managers/style/vars.style.manager';
import { Icon } from '../Icon.component';

export const TabList = (p: {
	tabs: iTab[]
	onUpdate: onTabUpdateFn
}) => {

	return (
		<div className="tab-list-wrapper">
			{/* ALL TABS LIST*/}
			{p.tabs.map(tab =>
				<Tab
					tab={tab}
					onUpdate={p.onUpdate}
				/>
			)}

			{/* ADD NEW TAB BUTTON*/}
			<div
				className="tab-wrapper tab-more"
				onClick={e => {
					p.onUpdate('add')
				}}
			>
				+
			</div>
		</div>
	)

}


const Tab = (p: {
	tab: iTab
	onUpdate: onTabUpdateFn
}) => {
	const { tab } = { ...p }

	let iconName = `Six`
	const nbLay = tab.grid.layout.length
	if (nbLay === 2) iconName = 'Two'
	if (nbLay === 3) iconName = 'Three'
	if (nbLay === 4) iconName = 'Four'
	if (nbLay === 5) iconName = 'Five'
	iconName = `faDice${iconName}`

	return (
		<div
			className={`tab-wrapper ${tab.active ? 'active' : ''}`}
		>
			<div className="active-ribbon"></div>
			<div className="tab-name"
				onClick={() => { p.onUpdate('activate', tab) }}
			> {tab.name}
			</div>

			{
				tab.grid.layout.length > 1 &&
				<div className="tab-nb-windows">
					<Icon name={iconName} color={`#b2b2b2`} />
				</div>
			}
			<div className="tab-close"
				onClick={() => p.onUpdate('close', tab)}>
				<Icon name="faPlus" color={`#b2b2b2`} />
			</div>
		</div >
	)
}

export const tabsCss = `
    .tab-list-wrapper {
				padding: 7px 0px 0px 13px;
				display: flex;
				background: #D8D8D8;
				width: 100%;
				overflow-x: scroll;
				border-radius: 0px 0px 0px 5px;
				.tab-wrapper {
						position: relative;
						align-items:center;
						display:flex;
						margin-right: 5px;
						padding: 5px;
						background: #D0D0D0;
						display: flex;
						color: ${cssVars.colors.grey1};
						font-family: ${cssVars.font.editor};
						height: 35px;
						box-shadow:rgb(0 0 0 / 20%) 0px -1px 2px ;
						border-radius: 5px 5px 0px 0px;
						justify-content: space-between;
						min-width: 120px;
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

								background: #EFEFEF;
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
`
