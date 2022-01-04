import { useEffect, useRef, useState } from "react";
import { MutableRefObject } from "react";
import { Job } from "../types";
const debounce = require("lodash.debounce");

/**
 * https://github.com/frontend-collective/react-sortable-tree/issues/904
 * In order to fix this problem use addJob function to queue next tree transformation tree
 * Tree will be transformed after user stops scrolling.
 */

export const useScrollQueue = <T extends unknown>(
    rootRef: MutableRefObject<HTMLElement | undefined | null>,
) => {
    const [scrolling, setScrolling] = useState(false);
    const scrollingRef = useRef(scrolling);
    const jobsRef = useRef<{ resolve: (result: T) => void; job: Job<T> }[]>([]);
    useEffect(() => {
        const root = rootRef.current;
        let scrollableContainer: HTMLElement | null = null;
        const removeScrolling = debounce(() => {
            setScrolling(false);
        }, 1000);

        const scroll = () => {
            setScrolling(true);
            removeScrolling();
        };
        (async () => {
            if (root) {
                await new Promise(resolve => {
                    setTimeout(() => {
                        resolve(null);
                    }, 1500);
                });

                scrollableContainer = root.querySelector(
                    ".rst__virtualScrollOverride",
                );
                if (!scrollableContainer) {
                    return;
                }

                scrollableContainer.addEventListener("scroll", scroll);
            }
        })();

        return () => {
            if (scrollableContainer) {
                scrollableContainer.removeEventListener("scroll", scroll);
            }
        };
    }, []);

    const jobsHandler = () => {
        if (scrollingRef.current) {
            return;
        }
        let jobs = jobsRef.current;
        while (jobs.length) {
            const j = jobs.shift();
            if (j) {
                const result = j.job();
                j.resolve(result);
            }
        }
    };

    useEffect(() => {
        scrollingRef.current = scrolling;
        jobsHandler();
    }, [scrolling]);

    const addJob = (job: Job<T>): Promise<T> => {
        const promise = new Promise<T>(async resolve => {
            jobsRef.current.push({ resolve, job });
            jobsHandler();
        });

        return promise;
    };

    return { addJob };
};
