#include <nan.h>
#include <Windows.h>

namespace bells {

	using v8::FunctionCallbackInfo;
	using v8::Isolate;
	using v8::Local;
	using v8::NewStringType;
	using v8::Object;
	using v8::String;
	using v8::Value;

	bool SwitchAutoStart(bool enable) {

		bool ret = false;
		HKEY hKey = 0;
		DWORD dwRet = 0;
		long lRet = 0;
		lRet = RegOpenKeyEx(HKEY_CURRENT_USER, "Software\\Microsoft\\Windows\\CurrentVersion\\Run", 0, KEY_WRITE | KEY_READ | KEY_WOW64_32KEY, &hKey);
		if (lRet == ERROR_SUCCESS)
		{
			if (enable) {

				char appFullPath[MAX_PATH];
				GetModuleFileName(0, appFullPath, MAX_PATH);
				dwRet = MAX_PATH;

				lRet = RegSetValueEx(hKey, "BellsAutoStart", 0, REG_SZ, (BYTE*)appFullPath, dwRet);
				if (lRet == ERROR_SUCCESS)
					ret = true;
			}
			else {
				lRet = RegDeleteValue(hKey, "BellsAutoStart");
				if (lRet == ERROR_SUCCESS)
					ret = true;
			}
			RegCloseKey(hKey);
		}
		return ret;
	}
	bool GetAutoStartStatus() {
		bool ret = false;
		HKEY hKey;
		long lRet = RegOpenKeyEx(HKEY_CURRENT_USER, "Software\\Microsoft\\Windows\\CurrentVersion\\Run", 0, KEY_WRITE | KEY_READ | KEY_WOW64_32KEY, &hKey);
		if (lRet == ERROR_SUCCESS)
		{
			char appFullPath[MAX_PATH];
			GetModuleFileName(0, appFullPath, MAX_PATH);

			char appFullPathData[MAX_PATH];
			LONG appFullPathDataLength = MAX_PATH;

			lRet = RegQueryValueA(hKey, "BellsAutoStart", appFullPathData, &appFullPathDataLength);
			if (lRet == ERROR_SUCCESS) {
				ret = strcmp(appFullPath, appFullPathData) == 0;
			}

			RegCloseKey(hKey);
		}
		return ret;
	}

	void MethodSetAutoStartEnable(const FunctionCallbackInfo<Value>& args) {

		if (args.Length() < 1) {
			Nan::ThrowTypeError("Wrong number of arguments");
			return;
		}
		if (!args[0]->IsBoolean()) {
			Nan::ThrowTypeError("Wrong arguments");
			return;
		}

		Isolate* isolate = args.GetIsolate();

		bool arg0 = args[0]->BooleanValue(isolate);
		bool reesult = SwitchAutoStart(arg0);
		args.GetReturnValue().Set(Nan::New(reesult));
	}
	void MethodGetAutoStartEnabled(const FunctionCallbackInfo<Value>& args) {
		bool b = GetAutoStartStatus();
		args.GetReturnValue().Set(Nan::New(b));
	}
	void MethodGetIsUserLeave(const FunctionCallbackInfo<Value>& args) {
		LASTINPUTINFO lpi;
		DWORD dwTime = 0;
		lpi.cbSize = sizeof(lpi);
		GetLastInputInfo(&lpi);
		dwTime = ::GetTickCount() - lpi.dwTime;
		bool b = dwTime >= 600000;
		args.GetReturnValue().Set(Nan::New(b));
	}
    void MethodGetLastInputTime(const FunctionCallbackInfo<Value>& args) {
		LASTINPUTINFO lpi;
		DWORD dwTime = 0;
		lpi.cbSize = sizeof(lpi);
		GetLastInputInfo(&lpi);
		dwTime = ::GetTickCount() - lpi.dwTime;
		args.GetReturnValue().Set(Nan::New((int)(dwTime / 1000)));
	}
	void MethodCloseMointor(const FunctionCallbackInfo<Value>& args) {
		PostMessage(HWND_BROADCAST, WM_SYSCOMMAND, SC_MONITORPOWER, (LPARAM)2);
		args.GetReturnValue().Set(Nan::New(true));
	}
	void MethodOpenMointor(const FunctionCallbackInfo<Value>& args) {
		PostMessage(HWND_BROADCAST, WM_SYSCOMMAND, SC_MONITORPOWER, (LPARAM)-1);
		args.GetReturnValue().Set(Nan::New(true));
	}
	void MethodSetPowerStateEnable(const FunctionCallbackInfo<Value>& args) {
		if (args.Length() < 1) {
			Nan::ThrowTypeError("Wrong number of arguments");
			return;
		}
		if (!args[0]->IsBoolean()) {
			Nan::ThrowTypeError("Wrong arguments");
			return;
		}

		Isolate* isolate = args.GetIsolate();

		bool arg0 = args[0]->BooleanValue(isolate);
		bool result = false;
		if (arg0)
			result = SetThreadExecutionState(ES_CONTINUOUS | ES_SYSTEM_REQUIRED |
				ES_AWAYMODE_REQUIRED | ES_DISPLAY_REQUIRED);
		else
			result = SetThreadExecutionState(ES_CONTINUOUS);

		args.GetReturnValue().Set(Nan::New(result));
	}
	void MethodGetVersion(const FunctionCallbackInfo<Value>& args) {
		Isolate* isolate = args.GetIsolate();
		v8::Local<v8::String> string = v8::String::NewFromUtf8(isolate, "v1.0", v8::NewStringType::kInternalized).ToLocalChecked();
		args.GetReturnValue().Set(string);
	}
  void MethodMessageBeep(const FunctionCallbackInfo<Value>& args) {
		if (args.Length() < 1) {
			Nan::ThrowTypeError("Wrong number of arguments");
			return;
		}
		if (!args[0]->IsNumber()) {
			Nan::ThrowTypeError("Wrong arguments");
			return;
		}

		double arg0 = args[0]->NumberValue();
		bool result = MessageBeep((UINT)arg0);

		args.GetReturnValue().Set(Nan::New(result));
	}

	void Initialize(Local<Object> exports) {
		NODE_SET_METHOD(exports, "setPowerStateEnable", MethodSetPowerStateEnable);
		NODE_SET_METHOD(exports, "setAutoStartEnable", MethodSetAutoStartEnable);
		NODE_SET_METHOD(exports, "getAutoStartEnabled", MethodGetAutoStartEnabled);
		NODE_SET_METHOD(exports, "getIsUserLeave", MethodGetIsUserLeave);
    NODE_SET_METHOD(exports, "getLastInputTime", MethodGetLastInputTime);
		NODE_SET_METHOD(exports, "closeMointor", MethodCloseMointor);
		NODE_SET_METHOD(exports, "openMointor", MethodOpenMointor);
    NODE_SET_METHOD(exports, "messageBeep", MethodMessageBeep);
		NODE_SET_METHOD(exports, "version", MethodGetVersion);
	}

	NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)

}