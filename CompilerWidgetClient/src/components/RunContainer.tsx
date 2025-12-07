// src/components/RunContainer.tsx
import React from 'react';
import cls from './RunContainer.module.scss';

import StartIcon from "../assets/start.svg?react";
import StopIcon from "../assets/stop.svg?react";

export const RunContainer: React.FC = () => {
    return (
        <div className={cls.runContainer}>
            <button className={cls.runButton}>
                <StartIcon className={cls.startIcon}/>
                <p className={cls.runText}>Run</p>
            </button>
            <button className={cls.stopButton}>
                <StopIcon className={cls.stopIcon}/>
                <p className={cls.runText}>Stop</p>
            </button>
        </div>
    );
};
