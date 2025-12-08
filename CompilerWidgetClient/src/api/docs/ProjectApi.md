# ProjectApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiProjectsCreatePost**](#apiprojectscreatepost) | **POST** /api/projects/create | |
|[**apiProjectsGet**](#apiprojectsget) | **GET** /api/projects | |
|[**apiProjectsProjectIdDelete**](#apiprojectsprojectiddelete) | **DELETE** /api/projects/{projectId} | |
|[**apiProjectsProjectIdDuplicatePost**](#apiprojectsprojectidduplicatepost) | **POST** /api/projects/{projectId}/duplicate | |
|[**apiProjectsProjectIdGet**](#apiprojectsprojectidget) | **GET** /api/projects/{projectId} | |
|[**apiProjectsProjectIdRenamePut**](#apiprojectsprojectidrenameput) | **PUT** /api/projects/{projectId}/rename | |
|[**apiProjectsProjectIdStatsGet**](#apiprojectsprojectidstatsget) | **GET** /api/projects/{projectId}/stats | |

# **apiProjectsCreatePost**
> string apiProjectsCreatePost()


### Example

```typescript
import {
    ProjectApi,
    Configuration,
    CreateProjectRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectApi(configuration);

let createProjectRequest: CreateProjectRequest; // (optional)

const { status, data } = await apiInstance.apiProjectsCreatePost(
    createProjectRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createProjectRequest** | **CreateProjectRequest**|  | |


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

# **apiProjectsGet**
> Array<ProjectInfo> apiProjectsGet()


### Example

```typescript
import {
    ProjectApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectApi(configuration);

const { status, data } = await apiInstance.apiProjectsGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<ProjectInfo>**

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

# **apiProjectsProjectIdDelete**
> apiProjectsProjectIdDelete()


### Example

```typescript
import {
    ProjectApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectApi(configuration);

let projectId: string; // (default to undefined)

const { status, data } = await apiInstance.apiProjectsProjectIdDelete(
    projectId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **projectId** | [**string**] |  | defaults to undefined|


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

# **apiProjectsProjectIdDuplicatePost**
> string apiProjectsProjectIdDuplicatePost()


### Example

```typescript
import {
    ProjectApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectApi(configuration);

let projectId: string; // (default to undefined)

const { status, data } = await apiInstance.apiProjectsProjectIdDuplicatePost(
    projectId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **projectId** | [**string**] |  | defaults to undefined|


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

# **apiProjectsProjectIdGet**
> ProjectInfo apiProjectsProjectIdGet()


### Example

```typescript
import {
    ProjectApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectApi(configuration);

let projectId: string; // (default to undefined)

const { status, data } = await apiInstance.apiProjectsProjectIdGet(
    projectId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **projectId** | [**string**] |  | defaults to undefined|


### Return type

**ProjectInfo**

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

# **apiProjectsProjectIdRenamePut**
> apiProjectsProjectIdRenamePut()


### Example

```typescript
import {
    ProjectApi,
    Configuration,
    RenameProjectRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectApi(configuration);

let projectId: string; // (default to undefined)
let renameProjectRequest: RenameProjectRequest; // (optional)

const { status, data } = await apiInstance.apiProjectsProjectIdRenamePut(
    projectId,
    renameProjectRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **renameProjectRequest** | **RenameProjectRequest**|  | |
| **projectId** | [**string**] |  | defaults to undefined|


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

# **apiProjectsProjectIdStatsGet**
> ProjectStats apiProjectsProjectIdStatsGet()


### Example

```typescript
import {
    ProjectApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectApi(configuration);

let projectId: string; // (default to undefined)

const { status, data } = await apiInstance.apiProjectsProjectIdStatsGet(
    projectId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **projectId** | [**string**] |  | defaults to undefined|


### Return type

**ProjectStats**

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

