# FileApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiFilesFileIdDeletePost**](#apifilesfileiddeletepost) | **POST** /api/files/{fileId}/delete | |
|[**apiFilesFileIdMovePost**](#apifilesfileidmovepost) | **POST** /api/files/{fileId}/move | |
|[**apiFilesFileIdRenamePost**](#apifilesfileidrenamepost) | **POST** /api/files/{fileId}/rename | |
|[**apiFilesFileIdSavePost**](#apifilesfileidsavepost) | **POST** /api/files/{fileId}/save | |
|[**apiFilesProjectIdGet**](#apifilesprojectidget) | **GET** /api/files/{projectId} | |
|[**apiFilesProjectProjectIdChangeAllPathsPost**](#apifilesprojectprojectidchangeallpathspost) | **POST** /api/files/project/{projectId}/change_all_paths | |
|[**apiFilesProjectProjectIdPost**](#apifilesprojectprojectidpost) | **POST** /api/files/project/{projectId} | |
|[**apiFilesReadFileIdGet**](#apifilesreadfileidget) | **GET** /api/files/read/{fileId} | |

# **apiFilesFileIdDeletePost**
> apiFilesFileIdDeletePost()


### Example

```typescript
import {
    FileApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new FileApi(configuration);

let fileId: string; // (default to undefined)

const { status, data } = await apiInstance.apiFilesFileIdDeletePost(
    fileId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **fileId** | [**string**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiFilesFileIdMovePost**
> apiFilesFileIdMovePost()


### Example

```typescript
import {
    FileApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new FileApi(configuration);

let fileId: string; // (default to undefined)
let body: string; // (optional)

const { status, data } = await apiInstance.apiFilesFileIdMovePost(
    fileId,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **string**|  | |
| **fileId** | [**string**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json, text/json, application/*+json
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiFilesFileIdRenamePost**
> string apiFilesFileIdRenamePost()


### Example

```typescript
import {
    FileApi,
    Configuration,
    RenameFileDto
} from './api';

const configuration = new Configuration();
const apiInstance = new FileApi(configuration);

let fileId: string; // (default to undefined)
let renameFileDto: RenameFileDto; // (optional)

const { status, data } = await apiInstance.apiFilesFileIdRenamePost(
    fileId,
    renameFileDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **renameFileDto** | **RenameFileDto**|  | |
| **fileId** | [**string**] |  | defaults to undefined|


### Return type

**string**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json, text/json, application/*+json
 - **Accept**: text/plain, application/json, text/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiFilesFileIdSavePost**
> string apiFilesFileIdSavePost()


### Example

```typescript
import {
    FileApi,
    Configuration,
    UpdateFileDto
} from './api';

const configuration = new Configuration();
const apiInstance = new FileApi(configuration);

let fileId: string; // (default to undefined)
let updateFileDto: UpdateFileDto; // (optional)

const { status, data } = await apiInstance.apiFilesFileIdSavePost(
    fileId,
    updateFileDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateFileDto** | **UpdateFileDto**|  | |
| **fileId** | [**string**] |  | defaults to undefined|


### Return type

**string**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json, text/json, application/*+json
 - **Accept**: text/plain, application/json, text/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiFilesProjectIdGet**
> Array<FileMetadata> apiFilesProjectIdGet()


### Example

```typescript
import {
    FileApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new FileApi(configuration);

let projectId: number; // (default to undefined)

const { status, data } = await apiInstance.apiFilesProjectIdGet(
    projectId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **projectId** | [**number**] |  | defaults to undefined|


### Return type

**Array<FileMetadata>**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: text/plain, application/json, text/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiFilesProjectProjectIdChangeAllPathsPost**
> apiFilesProjectProjectIdChangeAllPathsPost()


### Example

```typescript
import {
    FileApi,
    Configuration,
    PathChangeRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new FileApi(configuration);

let projectId: number; // (default to undefined)
let pathChangeRequest: PathChangeRequest; // (optional)

const { status, data } = await apiInstance.apiFilesProjectProjectIdChangeAllPathsPost(
    projectId,
    pathChangeRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pathChangeRequest** | **PathChangeRequest**|  | |
| **projectId** | [**number**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json, text/json, application/*+json
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiFilesProjectProjectIdPost**
> string apiFilesProjectProjectIdPost()


### Example

```typescript
import {
    FileApi,
    Configuration,
    CreateFileDto
} from './api';

const configuration = new Configuration();
const apiInstance = new FileApi(configuration);

let projectId: number; // (default to undefined)
let createFileDto: CreateFileDto; // (optional)

const { status, data } = await apiInstance.apiFilesProjectProjectIdPost(
    projectId,
    createFileDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createFileDto** | **CreateFileDto**|  | |
| **projectId** | [**number**] |  | defaults to undefined|


### Return type

**string**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json, text/json, application/*+json
 - **Accept**: text/plain, application/json, text/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiFilesReadFileIdGet**
> string apiFilesReadFileIdGet()


### Example

```typescript
import {
    FileApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new FileApi(configuration);

let fileId: string; // (default to undefined)

const { status, data } = await apiInstance.apiFilesReadFileIdGet(
    fileId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **fileId** | [**string**] |  | defaults to undefined|


### Return type

**string**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: text/plain, application/json, text/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

