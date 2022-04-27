import styled from '@emotion/styled';
import React, { useEffect, useRef, useState } from 'react';
import { iTab } from '../../../../shared/types.shared';
import { onTabUpdateFn } from '../../hooks/app/tabs.hook';

export const TabList = (p: {
	tabs: iTab[]
	onUpdate: onTabUpdateFn
}) => {

	return (
		<StyledDiv>
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
		</StyledDiv>
	)

}


const Tab = (p: {
	tab: iTab
	onUpdate: onTabUpdateFn
}) => {
	const { tab } = { ...p }
	return (
		<div
			className={`tab-wrapper ${tab.active ? 'active' : ''}`}
		>
			<div className="tab-name"
				onClick={() => { p.onUpdate('activate', tab) }}
			> {tab.name} ({tab.grid.layout.length})</div>

			<div className="tab-close"
				onClick={() => p.onUpdate('close', tab)}>
				x </div>
		</div >
	)
}

export const StyledDiv = styled.div`
    .tab-list-wrapper {
				padding: 20px;
				display: flex;
				.tab-wrapper {
						margin-right: 5px;
						padding: 5px;
						background: grey;
						display: flex;
						display: flex;
						min-width: 120px;
						max-height: 27px;
						overflow: hidden;
						box-shadow: rgba(0,0,0,0.2) 0px 0px 2px;
						text-align: center;
						&.active {
								background: white;
								font-weight: bold
						}
						&.tab-more {
								min-width: 30px;
								width: 30px;
								max-width: 30px;
								cursor: pointer;
						}
						.tab-name {
						//cursor: pointer;
						}
						.tab-close {
						cursor: pointer;
						margin-left: 5px;
						}
				}
		}
`
