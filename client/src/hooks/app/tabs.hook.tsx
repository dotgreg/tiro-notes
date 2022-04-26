import React, { useEffect, useRef, useState } from 'react';
import { iTab } from '../../../../shared/types.shared';
import { useLocalStorage } from '../useLocalStorage.hook';


export const useTabs = (p: {
}) => {

	const [tabs, setTabs] = useLocalStorage<iTab[]>('tabs', [])

	return {
tabs, setTabs
	}
}
