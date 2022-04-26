import styled from '@emotion/styled';
import React, { useEffect, useRef, useState } from 'react';
import { iTab } from '../../../../shared/types.shared';

type onUpdateTabFn = (tab: iTab) => void

export const TabList = (p: {
	tabs: iTab[]
	onClose: onUpdateTabFn
	onRename: onUpdateTabFn
	onMove: onUpdateTabFn
}) => {

	return (
		<StyledDiv>
			<div className="tab-list-wrapper">
				{p.tabs.map(tab =>
					<Tab
						tab={tab}
						onClose={p.onClose}
						onRename={p.onRename}
						onMove={p.onMove}
					/>
				)}
			</div>
		</StyledDiv>
	)

}

const Tab = (p: {
	tab: iTab
	onClose: onUpdateTabFn
	onRename: onUpdateTabFn
	onMove: onUpdateTabFn
}) => {
	const { tab } = { ...p }
	return (
		<div className="tab-wrapper">
			<div className="tab-name"> {tab.name} </div>
			<div className="tab-close" onClick={() => p.onClose(tab)}> x </div>
		</div >
	)
}

export const StyledDiv = styled.div`
    .tab-list-wrapper {
				padding: 20px;
    }
`
