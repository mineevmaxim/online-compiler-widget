// src/components/OutputPanel.tsx
import React, { useState } from 'react';
import cls from './OutputPanel.module.scss';
import HistoryIcon from "../assets/history.svg?react";
import OutputIcon from "../assets/output.svg?react";

interface OutputPanelProps {
    output: string;
    history: string[];
}

export const OutputPanel: React.FC<OutputPanelProps> = ({ output, history }) => {
    const [activeTab, setActiveTab] = useState<'output' | 'history'>('output');

    return (
        <div className={cls.outputPanel}>
            <div className={cls.tabs}>
                <button
                    className={`${cls.tab} ${activeTab === 'output' ? cls.active : ''}`}
                    onClick={() => setActiveTab('output')}
                >
                    <OutputIcon className={cls.icon}/>
                    <span>Вывод</span>
                </button>
                <button
                    className={`${cls.tab} ${activeTab === 'history' ? cls.active : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    <HistoryIcon className={cls.icon}/>
                    <span>История</span>
                </button>
            </div>

            <div className={cls.content}>
                {!output && activeTab === 'output' && (
                            <div className={cls.placeholder}>
                                <OutputIcon className={cls.bigIcon}/>
                                <p>Нет результата кода</p>
                                <small>Запустите свой код, чтобы увидеть результат</small>
                            </div>
                )}

                <p className={cls.output}>{output}</p>

                {activeTab === 'history' && (
                            <div className={cls.placeholder}>
                                <HistoryIcon className={cls.bigIcon}/>
                                <p>История пуста</p>
                            </div>)}
            </div>
        </div>
    );
};