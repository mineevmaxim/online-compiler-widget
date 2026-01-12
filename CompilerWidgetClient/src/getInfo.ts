import { ProjectApi  } from "./api"
import type {WidgetInfoRequest} from "./api"


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

        const widgetInfoRequest: WidgetInfoRequest = {
            widgetId: Number(model.widgetId),
            userId: model.userId,
            role: model.role,
            config: model.config,
            board: {
                id: model.board.id,
                name: model.board.name,
                parentId: model.board.parentId
            }
        };

        const response2 = await api.apiProjectsWidgetGetInfoPost(widgetInfoRequest)
        
        console.log('Статус ответа:', response2.status);
        
        // Предположим, что статус 201 = создан новый, 200 = уже существовал
        return response.status === 201;
    } catch (error) {
        console.error('Ошибка при создании/получении проекта:', error);
        alert("Произошла ошибка при работе с проектом");
        throw error; // или верни false/по умолчанию
    }
}

export async function updateInfo(model: GetInfoModel): Promise<boolean> {
    try {
        const api = new ProjectApi();

        // Преобразуем GetInfoModel в WidgetInfoRequest
        const widgetInfoRequest: WidgetInfoRequest = {
            widgetId: Number(model.widgetId),
            userId: model.userId,
            role: model.role,
            config: model.config,
            board: {
                id: model.board.id,
                name: model.board.name,
                parentId: model.board.parentId,
            },
        };

        const response = await api.apiProjectsWidgetWidgetIdPut(Number(model.widgetId), widgetInfoRequest);

        console.log('Статус ответа:', response.status);

        // Если статус 200, считаем, что обновление прошло успешно
        return response.status === 200;
    } catch (error) {
        console.error('Ошибка при обновлении виджета:', error);
        alert("Произошла ошибка при обновлении виджета");
        return false;
    }
}

export async function getWidgetInfo(widgetId: number): Promise<WidgetInfoRequest | null> {
    try {
        const api = new ProjectApi();
        const response = await api.apiProjectsWidgetWidgetIdGet(widgetId);

        console.log('Статус ответа:', response.status);

        // Предположим, что response.data содержит WidgetInfoRequest
        return response.data as WidgetInfoRequest;
    } catch (error) {
        console.error('Ошибка при получении информации о виджете:', error);
        alert("Произошла ошибка при получении информации о виджете");
        return null;
    }
}