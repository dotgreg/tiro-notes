import styled from '@emotion/styled';
import { cloneDeep } from 'lodash';
import React, { useEffect } from 'react';
import { iGrid, iTab, iWindow } from '../../../../shared/types.shared';
import { DraggableGrid } from './DraggableGrid.component';

export const WindowGrid = (p: {
	tab: iTab
	onGridUpdate: (grid: iGrid) => void
}) => {
	const { tab } = { ...p }

	return (
		<StyledDiv>
			<div className="window-grid-wrapper"
				onClick={() => {

					//const nLayout = cloneDeep(tab.layout)
					//nLayout[0].id = "WOOOOOOOOOOOOOP"
					//p.onUpdateLayout(nLayout)

				}}
			>


				{/* {tab.name}
				{JSON.stringify(tab.layout)}
 */}


				<DraggableGrid
					refresh={tab.refresh || 0}
					grid={tab.grid}
					onGridUpdate={p.onGridUpdate}
				/>
			</div>
		</StyledDiv>
	)

}
export const StyledDiv = styled.div`
		height: 100%;
    .window-grid-wrapper {
				height: 100%;
		}
`
