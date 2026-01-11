# CompilerApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiCompileProjectProjectIdCompilePost**](#apicompileprojectprojectidcompilepost) | **POST** /api/compile/project/{projectId}/compile | |
|[**apiCompileProjectProjectIdRunPost**](#apicompileprojectprojectidrunpost) | **POST** /api/compile/project/{projectId}/run | |
|[**apiCompileProjectProjectIdStatusGet**](#apicompileprojectprojectidstatusget) | **GET** /api/compile/project/{projectId}/status | |
|[**apiCompileProjectProjectIdStopPost**](#apicompileprojectprojectidstoppost) | **POST** /api/compile/project/{projectId}/stop | |
|[**apiCompileRunningProjectsGet**](#apicompilerunningprojectsget) | **GET** /api/compile/running-projects | |

# **apiCompileProjectProjectIdCompilePost**
> CompileResult apiCompileProjectProjectIdCompilePost()


### Example

```typescript
import {
    CompilerApi,
    Configuration,
    CompileRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new CompilerApi(configuration);

let projectId: number; // (default to undefined)
let compileRequest: CompileRequest; // (optional)

const { status, data } = await apiInstance.apiCompileProjectProjectIdCompilePost(
    projectId,
    compileRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **compileRequest** | **CompileRequest**|  | |
| **projectId** | [**number**] |  | defaults to undefined|


### Return type

**CompileResult**

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

# **apiCompileProjectProjectIdRunPost**
> RunResult apiCompileProjectProjectIdRunPost()


### Example

```typescript
import {
    CompilerApi,
    Configuration,
    RunRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new CompilerApi(configuration);

let projectId: number; // (default to undefined)
let runRequest: RunRequest; // (optional)

const { status, data } = await apiInstance.apiCompileProjectProjectIdRunPost(
    projectId,
    runRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **runRequest** | **RunRequest**|  | |
| **projectId** | [**number**] |  | defaults to undefined|


### Return type

**RunResult**

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

# **apiCompileProjectProjectIdStatusGet**
> ProcessStatus apiCompileProjectProjectIdStatusGet()


### Example

```typescript
import {
    CompilerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CompilerApi(configuration);

let projectId: number; // (default to undefined)

const { status, data } = await apiInstance.apiCompileProjectProjectIdStatusGet(
    projectId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **projectId** | [**number**] |  | defaults to undefined|


### Return type

**ProcessStatus**

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

# **apiCompileProjectProjectIdStopPost**
> apiCompileProjectProjectIdStopPost()


### Example

```typescript
import {
    CompilerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CompilerApi(configuration);

let projectId: number; // (default to undefined)

const { status, data } = await apiInstance.apiCompileProjectProjectIdStopPost(
    projectId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **projectId** | [**number**] |  | defaults to undefined|


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

# **apiCompileRunningProjectsGet**
> Array<RunningProjectInfo> apiCompileRunningProjectsGet()


### Example

```typescript
import {
    CompilerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CompilerApi(configuration);

const { status, data } = await apiInstance.apiCompileRunningProjectsGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<RunningProjectInfo>**

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

