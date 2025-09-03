import {throttle, debounce} from "lodash-es"
import { useCallback, useEffect, useRef } from "react";

export function useThrottle(cb, delay) {
	const options = { leading: true, trailing: false }; // add custom lodash options
	const cbRef = useRef(cb);
	// use mutable ref to make useCallback/throttle not depend on `cb` dep
	useEffect(() => { cbRef.current = cb; });
	return useCallback(
		throttle((...args) => cbRef.current(...args), delay, options),
		[delay]
	);
}

export function useDebounce(cb: any, delay: number, leading = false) {
	const options = {
		leading: false,
		trailing: true
	};
	if (leading) options.leading = leading
	const inputsRef = useRef(cb);
	const isMounted = useIsMounted();
	useEffect(() => {
		inputsRef.current = { cb, delay };
	});

	return useCallback(
		debounce(
			(...args) => {
				// Don't execute callback, if (1) component in the meanwhile 
				// has been unmounted or (2) delay has changed
				if (inputsRef.current.delay === delay && isMounted())
					inputsRef.current.cb(...args);
			},
			delay,
			options
		),
		[delay, debounce]
	);
}

function useIsMounted() {
	const isMountedRef = useRef(true);
	useEffect(() => {
		return () => {
			isMountedRef.current = false;
		};
	}, []);
	return () => isMountedRef.current;
}
