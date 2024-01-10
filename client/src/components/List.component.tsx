import React from 'react';
import styled from '@emotion/styled'
import { iFile } from '../../../shared/types.shared';
import { cloneDeep, debounce, isEqual, isNumber, max } from 'lodash-es';
import { formatDateList } from '../managers/date.manager';
import { absoluteLinkPathRoot } from '../managers/textProcessor.manager';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { cssVars } from '../managers/style/vars.style.manager';
import { deviceType, isA } from '../managers/device.manager';
import { getLoginToken } from '../hooks/app/loginToken.hook';
import { getKeyModif } from '../managers/keys.manager';
import { SortModes } from '../managers/sort.manager';
import { FilesPreviewObject } from '../hooks/api/files.api.hook';


// export const SortModeArr = ['none','alphabetical','created','modified']
export type onFileDragStartFn = (files: iFile[]) => void



class ListInt extends React.Component<{
	files: iFile[]
	filesPreview: FilesPreviewObject

	activeFileIndex: number
	hoverMode: boolean
	sortMode: number

	onFileClicked: (fileIndex: number) => void
	onVisibleItemsChange: (visibleFilesPath: string[]) => void
	onFileDragStart: onFileDragStartFn
	onFileDragEnd: () => void
}, {
	hoverMode: boolean,
	selectionEdges: [number, number]
}> {

	constructor(props: any) {
		super(props)
		this.state = {
			hoverMode: false,
			selectionEdges: [-1, -1],
		}
	}


	oldFiles: iFile[] = []
	liRefs: any[] = []

	scrollerWrapperRef: any = React.createRef()
	scrollerListRef: any = React.createRef()
	canAutoScroll = false
	shouldComponentUpdate(props: any, nextProps: any) {
		if (JSON.stringify(props.files) !== JSON.stringify(this.oldFiles)) {
			this.oldFiles = cloneDeep(props.files)
			this.liRefs = []
			for (let i = 0; i < props.files.length; i++) {
				this.liRefs.push(React.createRef())
			}
			this.getVisibleItemsDebounced()

			this.setState({ selectionEdges: [-1, -1] })

			// console.log(`[LIST] reinit canAutoScroll`);
			this.canAutoScroll = true
		}
		// const p2 = this.props

		// only scroll to items on load
		if (this.props.activeFileIndex > 0 && this.canAutoScroll) {
			this.canAutoScroll = false
			this.autoScrollToItem(this.props.activeFileIndex)
		}

		return true
	}

	getVisibleItemsDebounced = debounce(() => {
		let wrapper = this.scrollerWrapperRef.current
		if (!wrapper) return
		let wrapperHeight = wrapper.getBoundingClientRect().height
		let initElFocus = -1

		let visibleFilesPath: string[] = []
		for (let i = 0; i < this.liRefs.length; i++) {
			let el = this.liRefs[i].current

			if (el) {
				let elTop = el.getBoundingClientRect().top
				// adding some margin, notably after for smoother view
				if (elTop > -50 && elTop < wrapperHeight + 100) {
					if (initElFocus === -1) initElFocus = i
					this.props.files[i] && visibleFilesPath.push(this.props.files[i]?.path)
				}
			}
		}

		this.props.onVisibleItemsChange(visibleFilesPath)
	}, 500)

	onListScroll = () => {
		// disable auto scroll on manual scroll
		this.canAutoScroll = false
		this.getVisibleItemsDebounced()
	}


	isMultiSelected = (i: number): boolean => {
		let res = false
		if (
			this.state.selectionEdges[0] <= i &&
			this.state.selectionEdges[1] >= i
		) res = true
		return res
	}


	itemToScroll: number = 0
	autoScrollToItem = (nb: number, isAbs = true) => {
		this.itemToScroll = isAbs ? nb : this.itemToScroll + nb
		if (this.itemToScroll < 0) this.itemToScroll = 0
		if (this.itemToScroll > this.props.files.length) this.itemToScroll = this.props.files.length
		this.scrollerListRef.current.scrollToItem(this.itemToScroll)
	}


	getUrlLoginToken = () => `?token=${getLoginToken()}`;


	render() {
		let sort = SortModes[this.props.sortMode]
		const itemSize = cssVars.sizes.l2.fileLi.height + (cssVars.sizes.l2.fileLi.padding * 2) + (cssVars.sizes.l2.fileLi.margin)
		const listHeight = window.innerHeight - (cssVars.sizes.search.h + cssVars.sizes.search.padding)
		const responsiveListHeight = isA('desktop') ? listHeight : listHeight - cssVars.sizes.mobile.bottomBarHeight
		return (
			<>

				<div
					className='list-wrapper-scroller'
					style={{ height: responsiveListHeight }}
					onScroll={this.onListScroll}
					ref={this.scrollerWrapperRef}
				>



					<AutoSizer>{({ height, width }) => (
						<FixedSizeList
							itemData={this.props.files}
							className="List"
							ref={this.scrollerListRef}
							height={responsiveListHeight}
							itemCount={this.props.files.length}
							itemSize={itemSize}
							width={width || 0}
							onScroll={this.onListScroll}
						>
							{({ index, style }) => {
								let file = this.props.files[index]
								let filePreview = this.props.filesPreview[file.path]
								return (
									<div style={style}>
										<li
											ref={this.liRefs[index]}
											style={{ width: width || 0 - (sizes.l2.fileLi.padding * 2) - (sizes.l2.fileLi.margin * 2) - 35 }}
											className={[
												'file-element-list',
												`element-${index}`,
												`${this.isMultiSelected(index) ? 'active' : ''}`,
												`${index === this.props.activeFileIndex ? 'active' : ''}`,
												`${filePreview && filePreview.picture ? 'with-image' : ''}`
											].join(' ')}
											key={index}
											draggable={true}
											onDragStart={() => {
												let files: iFile[] = []
												let selec = this.state.selectionEdges
												if (selec[0] !== -1 || selec[1] !== -1) {
													files = this.props.files.slice(selec[0], selec[1] + 1)
												} else {
													files = [file]
												}
												this.props.onFileDragStart(files)
											}}
											onDragEnd={() => {
												this.props.onFileDragEnd()
											}}
											onClick={(e) => {

												if (getKeyModif('shift')) {
													let edges: [number, number] = [this.props.activeFileIndex, index]
													edges.sort()
													this.setState({ selectionEdges: edges })
												} else {
													this.props.onFileClicked(index)
													this.setState({ selectionEdges: [-1, -1] })
												}

												this.props.onFileClicked(index)
												// this.setState({ selectionEdges: [-1, -1] })
											}}
										>
											<div className="background-item"></div>
											<div className="background-item-border"></div>

											<div className="left">
												<h3
													className={`label ${file.name.length <= 35 ? "oneliner" : "more"}`}
													onMouseEnter={(e) => {
														this.props.hoverMode && this.props.onFileClicked(index)
													}}>
													{file.name}
												</h3>
												<div className="content">
													{
														(filePreview && filePreview.content) &&
														<>{filePreview.content}</>
													}

												</div>
												<div className={`date ${sort}`} >
													{formatDateList(
														new Date(
															(sort === 'modified' ? file.modified : file.created) || 0
														)
													)}
												</div>
											</div>
											<div className="right">
												{
													(filePreview && filePreview.picture) &&
													<div
														className="picture"
														style={{
															backgroundColor: 'white',
															backgroundImage: `url('${filePreview.picture.startsWith('http') ? filePreview.picture + this.getUrlLoginToken() : `${absoluteLinkPathRoot(this.props.files[0].folder)}/${filePreview.picture}${this.getUrlLoginToken()}`}')`
														}}
													>
													</div>
												}
											</div>


										</li>
									</div>
								)
							}
							}
						</FixedSizeList>)}
					</AutoSizer>
				</div>
			</>
		);
	}
}

export const List = React.memo(ListInt, (np, pp) => {
	// if 

	return false
})



const { els, colors, font, sizes } = { ...cssVars }
export const filesListCss = () => `
.list-wrapper {
    .list-wrapper-scroller{
        height: 100%;
        width: calc(100% + 20px);
        overflow-y:scroll;
        overflow: hidden;
    }

    .mobile-buttons-up-down {
        position: fixed;
        right: 0px;
        z-index: 10;
        top: 50%;
        div {
            background: #d6d6d6;
            padding: 10px;
            color:white;
            cursor: pointer;
        }
    }

    div.List {
        list-style: none;
        margin-right:20px;
        padding: 0px 0px 0px 0px;
        &.multiselect-mode {
						li .label {
								margin-left: 4px;
						}
        }

        // NORMAL
        li {
			max-width:calc(100% - 47px);
            padding: ${sizes.l2.fileLi.padding}px ${sizes.block - sizes.l2.fileLi.margin}px;
            margin: ${sizes.l2.fileLi.margin}px ${sizes.l2.fileLi.margin + 5}px ${sizes.l2.fileLi.margin}px ${sizes.l2.fileLi.margin}px ;
            display: block;
            cursor: pointer;
            position: relative;
            height: ${sizes.l2.fileLi.height}px;
            overflow: hidden;
            border: 2px rgba(0,0,0,0) solid;
            
            // ACTIVE
            &:hover,
            &.multiselected,
            &.active  {
            }

            display: flex;
            justify-content: center;
						&.active .background-item-border,
						&.active .background-item {
								width: 100%;
								height: 100%;
								position: absolute;
								top: 0px;
								left: 0px;
								background: ${cssVars.colors.main};
								border-radius: 5px;
								z-index: -1;
								opacity: 0.2;
						}
						&.active .background-item-border {
								width: calc(100% - 4px);
								height: calc(100% - 4px);
								background: none;
								border: 2px ${cssVars.colors.main} solid;
								opacity: 0.3;
						}
            
						h3 {
								font-size: 12px;
						}
            .left {
								// width: calc(100% - ${sizes.l2.fileLi.img}px - 10px);
								width: 100%;
								padding-right: 10px;

								display:flex;
								flex-direction:column;

								.label {
										margin: 0px;
										max-height: 35px;
										//height: 46px;
										// display: flex;
										// align-items: center;
										margin-bottom: 2px;
										overflow: hidden;
										text-overflow: ellipsis;
										color: ${colors.l2.title};
										line-break: anywhere;
								}
								
								.content {
										color: grey;
										margin-bottom: 3px;
										height: 25px;
										font-size: 9px;
										overflow: hidden;
										line-break: anywhere;
										word-break: break-word;
										${isA('desktop') ? '' : 'max-height: 25px;'}
								}

								.date {
										color: ${colors.l2.date};
										font-size: 10px;
										font-weight: 700;
								}
            }

            .right {
								.picture {
										width: ${sizes.l2.fileLi.img}px;
										height: ${sizes.l2.fileLi.img}px;
										background-size: cover;
										z-index: 1;
										margin-top: 3px;
										border-radius: 5px;
										border: 2px white solid;
								}
            }
        }
    }
}
`
