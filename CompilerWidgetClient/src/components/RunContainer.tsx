// src/components/RunContainer.tsx
import React from 'react';
import cls from './RunContainer.module.scss';

import StartIcon from "../assets/start.svg?react";
import StopIcon from "../assets/stop.svg?react";
import SaveIcon from "../assets/save-icon.svg?react"
import type {EditorDocument} from "../types/EditorDocument.ts";
import type {UpdateFileDto} from "../api";

interface RunContainerProps {
    run: () => void,
    stop: () => void,
    save: () => void,
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
            <button className={cls.saveButton} onClick={props.save}>
                <SaveIcon className={cls.saveIcon}/>
                <p className={cls.runText}>Save</p>
            </button>
        </div>
    );
};
