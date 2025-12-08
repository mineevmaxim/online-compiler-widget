// src/components/RunContainer.tsx
import React from 'react';
import cls from './RunContainer.module.scss';

import StartIcon from "../assets/start.svg?react";
import StopIcon from "../assets/stop.svg?react";

interface RunContainerProps {
    run: () => void,
    stop: () => void
}

export const RunContainer: React.FC<RunContainerProps> = (props: RunContainerProps) => {
    return (
        <div className={cls.runContainer}>
            <button className={cls.runButton} onClick={props.run}>
                <StartIcon className={cls.startIcon}/>
                <p className={cls.runText}>Run</p>
            </button>
            <button className={cls.stopButton} onClick={props.stop}>
                <StopIcon className={cls.stopIcon}/>
                <p className={cls.runText}>Stop</p>
            </button>
        </div>
    );
};
