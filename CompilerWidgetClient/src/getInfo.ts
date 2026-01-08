import { ProjectApi } from "./api"

export interface GetInfoModel {
    widgetId: string,
    userId: number,
    role: string,
    config: string,
    board: {
        id: number,
        name: string,
        parentId: number
    }
}

export async function getInfo(model: GetInfoModel): Promise<boolean> {
    try {
        const api = new ProjectApi();
        const response = await api.apiProjectsGetOrCreateProjectIdPost(model.widgetId.toString());
        
        console.log('Статус ответа:', response.status);
        
        // Предположим, что статус 201 = создан новый, 200 = уже существовал
        return response.status === 201;
    } catch (error) {
        console.error('Ошибка при создании/получении проекта:', error);
        alert("Произошла ошибка при работе с проектом");
        throw error; // или верни false/по умолчанию
    }
}