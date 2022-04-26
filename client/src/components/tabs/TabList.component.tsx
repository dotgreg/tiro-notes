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
			> {tab.name} </div>

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
				display: flex;
				&.active {
						font-weight: bold
				}
		}
    }
`
