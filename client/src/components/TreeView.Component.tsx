import React from 'react';
import Tree from 'rc-tree';
import styled from '@emotion/styled'
import { iFolder } from '../../../shared/types.shared';
import { iconFolder } from '../../assets/icon';

const STYLE = `
.rc-tree-child-tree {
  display: block;
}

.node-motion {
  transition: all .3s;
  overflow-y: hidden;
}
`;

const motion = {
  motionName: 'node-motion',
  motionAppear: false,
  onAppearStart: (node:any) => {
    console.log('Start Motion:', node);
    return { height: 0 };
  },
  onAppearActive: (node:any) => ({ height: node.scrollHeight }),
  onLeaveStart: (node:any) => ({ height: node.offsetHeight }),
  onLeaveActive: () => ({ height: 0 }),
};

const gData = [
  { title: '0-0', key: '0-0' },
  { title: '0-1', key: '0-1' },
  { title: '0-2', key: '0-2', children: [{ title: '0-2-0', key: '0-2-0' }] },
];

const LocalStorageMixin = require('react-localstorage');
const reactMixin = require('react-mixin');
@reactMixin.decorate(LocalStorageMixin)
export class TreeView extends React.Component<{
  folder: iFolder
  onFolderClicked: (folderPath:string) => void
},{}> {
  state = {
    gData,
    autoExpandParent: true,
    expandedKeys: ['0-0-key', '0-0-0-key', '0-0-0-0-key'],
  };

  onDragEnter = ({ expandedKeys }:any) => {
    console.log('enter', expandedKeys);
    this.setState({
      expandedKeys,
    });
  };

  onDrop = (info:any) => {
    console.log('drop', info);
    const dropKey = info.node.props.eventKey;
    const dragKey = info.dragNode.props.eventKey;
    const dropPos = info.node.props.pos.split('-');
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

    const loop = (data:any, key:any, callback:any) => {
      data.forEach((item:any, index:any, arr:any) => {
        if (item.key === key) {
          callback(item, index, arr);
          return;
        }
        if (item.children) {
          loop(item.children, key, callback);
        }
      });
    };
    const data = [...this.state.gData];

    // Find dragObject
    let dragObj:any;
    loop(data, dragKey, (item:any, index:any, arr:any) => {
      arr.splice(index, 1);
      dragObj = item;
    });

    if (!info.dropToGap) {
      // Drop on the content
      loop(data, dropKey, (item:any) => {
        item.children = item.children || [];
        // where to insert 示例添加到尾部，可以是随意位置
        item.children.push(dragObj);
      });
    } else if (
      (info.node.props.children || []).length > 0 && // Has children
      info.node.props.expanded && // Is expanded
      dropPosition === 1 // On the bottom gap
    ) {
      loop(data, dropKey, (item:any) => {
        item.children = item.children || [];
        // where to insert 示例添加到尾部，可以是随意位置
        item.children.unshift(dragObj);
      });
    } else {
      // Drop on the gap
      let ar:any;
      let i:any;
      loop(data, dropKey, (item:any, index:any, arr:any) => {
        ar = arr;
        i = index;
      });
      if (dropPosition === -1) {
        ar.splice(i, 0, dragObj);
      } else {
        ar.splice(i + 1, 0, dragObj);
      }
    }

    this.setState({
      gData: data,
    });
  };

  onExpand = (expandedKeys:any) => {
    console.log('onExpand', expandedKeys);
    this.setState({
      expandedKeys,
      autoExpandParent: false,
    });
  };

  render() {
    const { expandedKeys } = this.state;

    return (
        <StyledWrapper>
        <div className="draggable-demo">
            <style dangerouslySetInnerHTML={{ __html: STYLE }} />
            <Tree
              expandedKeys={expandedKeys}
              onExpand={this.onExpand}
              autoExpandParent={this.state.autoExpandParent}
              draggable
              //   onDragStart={this.onDragStart}
              onDragEnter={this.onDragEnter}
              onSelect={(key, info) => { this.props.onFolderClicked(info.node.key as string) }}
              onDrop={this.onDrop}
              treeData={[this.props.folder]}
              motion={motion}
            />
        </div>
        </StyledWrapper>
    );
  }
}



const StyledWrapper  = styled.div`
.rc-tree {
  margin: 0;
  border: 1px solid transparent;
}
.rc-tree-focused:not(.rc-tree-active-focused) {
  border-color: cyan;
}
.rc-tree .rc-tree-treenode {
  margin: 0;
  padding: 0;
  line-height: 24px;
  white-space: nowrap;
  list-style: none;
  outline: 0;
}
.rc-tree .rc-tree-treenode .draggable {
  color: #dddddd;
  -moz-user-select: none;
  -khtml-user-select: none;
  -webkit-user-select: none;
  user-select: none;
  /* Required to make elements draggable in old WebKit */
  -khtml-user-drag: element;
  -webkit-user-drag: element;
}
.rc-tree .rc-tree-treenode.drop-container > .draggable::after {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  box-shadow: inset 0 0 0 2px red;
  content: "";
}
.rc-tree .rc-tree-treenode.drop-container ~ .rc-tree-treenode {
  border-left: 2px solid chocolate;
}
.rc-tree .rc-tree-treenode.drop-target {
  background-color: yellowgreen;
}
.rc-tree .rc-tree-treenode.drop-target ~ .rc-tree-treenode {
  border-left: none;
}
.rc-tree .rc-tree-treenode.filter-node > .rc-tree-node-content-wrapper {
  color: #a60000 !important;
  font-weight: bold !important;
}
.rc-tree .rc-tree-treenode ul {
  margin: 0;
  padding: 0 0 0 18px;
}
.rc-tree .rc-tree-treenode .rc-tree-node-content-wrapper {
  position: relative;
  display: inline-block;
  height: 24px;
  margin: 0;
  padding: 0;
  text-decoration: none;
  vertical-align: top;
  cursor: pointer;
}
.rc-tree .rc-tree-treenode span.rc-tree-switcher,
.rc-tree .rc-tree-treenode span.rc-tree-checkbox,
.rc-tree .rc-tree-treenode span.rc-tree-iconEle {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 2px;
  line-height: 16px;
  vertical-align: -0.125em;
  background-color: transparent;
  background-image: url('${iconFolder}');
  background-repeat: no-repeat;
  background-attachment: scroll;
  border: 0 none;
  outline: none;
  cursor: pointer;
}
.rc-tree .rc-tree-treenode span.rc-tree-switcher.rc-tree-icon__customize,
.rc-tree .rc-tree-treenode span.rc-tree-checkbox.rc-tree-icon__customize,
.rc-tree .rc-tree-treenode span.rc-tree-iconEle.rc-tree-icon__customize {
  background-image: none;
}
.rc-tree .rc-tree-treenode span.rc-tree-icon_loading {
  margin-right: 2px;
  vertical-align: top;
  background: url('data:image/gif;base64,R0lGODlhEAAQAKIGAMLY8YSx5HOm4Mjc88/g9Ofw+v///wAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQFCgAGACwAAAAAEAAQAAADMGi6RbUwGjKIXCAA016PgRBElAVlG/RdLOO0X9nK61W39qvqiwz5Ls/rRqrggsdkAgAh+QQFCgAGACwCAAAABwAFAAADD2hqELAmiFBIYY4MAutdCQAh+QQFCgAGACwGAAAABwAFAAADD1hU1kaDOKMYCGAGEeYFCQAh+QQFCgAGACwKAAIABQAHAAADEFhUZjSkKdZqBQG0IELDQAIAIfkEBQoABgAsCgAGAAUABwAAAxBoVlRKgyjmlAIBqCDCzUoCACH5BAUKAAYALAYACgAHAAUAAAMPaGpFtYYMAgJgLogA610JACH5BAUKAAYALAIACgAHAAUAAAMPCAHWFiI4o1ghZZJB5i0JACH5BAUKAAYALAAABgAFAAcAAAMQCAFmIaEp1motpDQySMNFAgA7') no-repeat scroll 0 0 transparent;
}
.rc-tree .rc-tree-treenode span.rc-tree-switcher.rc-tree-switcher-noop {
  cursor: auto;
}
.rc-tree .rc-tree-treenode span.rc-tree-switcher.rc-tree-switcher_open {
  background-position: -93px -56px;
}
.rc-tree .rc-tree-treenode span.rc-tree-switcher.rc-tree-switcher_close {
  background-position: -75px -56px;
}
.rc-tree .rc-tree-treenode span.rc-tree-checkbox {
  width: 13px;
  height: 13px;
  margin: 0 3px;
  background-position: 0 0;
}
.rc-tree .rc-tree-treenode span.rc-tree-checkbox-checked {
  background-position: -14px 0;
}
.rc-tree .rc-tree-treenode span.rc-tree-checkbox-indeterminate {
  background-position: -14px -28px;
}
.rc-tree .rc-tree-treenode span.rc-tree-checkbox-disabled {
  background-position: 0 -56px;
}
.rc-tree .rc-tree-treenode span.rc-tree-checkbox.rc-tree-checkbox-checked.rc-tree-checkbox-disabled {
  background-position: -14px -56px;
}
.rc-tree .rc-tree-treenode span.rc-tree-checkbox.rc-tree-checkbox-indeterminate.rc-tree-checkbox-disabled {
  position: relative;
  background: #ccc;
  border-radius: 3px;
}
.rc-tree .rc-tree-treenode span.rc-tree-checkbox.rc-tree-checkbox-indeterminate.rc-tree-checkbox-disabled::after {
  position: absolute;
  top: 5px;
  left: 3px;
  width: 5px;
  height: 0;
  border: 2px solid #fff;
  border-top: 0;
  border-left: 0;
  -webkit-transform: scale(1);
  transform: scale(1);
  content: ' ';
}
.rc-tree:not(.rc-tree-show-line) .rc-tree-treenode .rc-tree-switcher-noop {
  background: none;
}
.rc-tree.rc-tree-show-line .rc-tree-treenode:not(:last-child) > ul {
  background: url('data:image/gif;base64,R0lGODlhCQACAIAAAMzMzP///yH5BAEAAAEALAAAAAAJAAIAAAIEjI9pUAA7') 0 0 repeat-y;
}
.rc-tree.rc-tree-show-line .rc-tree-treenode:not(:last-child) > .rc-tree-switcher-noop {
  background-position: -56px -18px;
}
.rc-tree.rc-tree-show-line .rc-tree-treenode:last-child > .rc-tree-switcher-noop {
  background-position: -56px -36px;
}
.rc-tree-child-tree {
  display: none;
}
.rc-tree-child-tree-open {
  display: block;
}
.rc-tree-treenode-disabled > span:not(.rc-tree-switcher),
.rc-tree-treenode-disabled > a,
.rc-tree-treenode-disabled > a span {
  color: #767676;
  cursor: not-allowed;
}
.rc-tree-treenode-active {
  background: rgba(0, 0, 0, 0.1);
}
.rc-tree-node-selected {
  /* background-color: #ffe6b0; */
  /* padding:  */
  /* box-shadow: 0 0 0 1px #ffb951; */
  opacity: 0.8;
  background: rgba(255,255,255,0.2);
}
.rc-tree-icon__open {
  margin-right: 2px;
  vertical-align: top;
  background-position: -110px -16px;
}
.rc-tree-icon__close {
  margin-right: 2px;
  vertical-align: top;
  background-position: -110px 0;
}
.rc-tree-icon__docu {
  margin-right: 2px;
  vertical-align: top;
  background-position: -110px 0px;
}
.rc-tree-icon__customize {
  margin-right: 2px;
  vertical-align: top;
}
.rc-tree-title {
  display: inline-block;
}
.rc-tree-indent {
  display: inline-block;
  vertical-align: bottom;
  height: 0;
}
.rc-tree-indent-unit {
  width: 16px;
  display: inline-block;
}

`