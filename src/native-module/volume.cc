#include "volume.h"

HRESULT hr;
IMMDeviceEnumerator* pDeviceEnumerator = 0;
IMMDevice* pDevice = 0;
IAudioEndpointVolume* pAudioEndpointVolume = 0;
IAudioClient* pAudioClient = 0;
bool inited = false;


bool InitVolume() {
	hr = CoCreateInstance(__uuidof(MMDeviceEnumerator), NULL, CLSCTX_ALL, __uuidof(IMMDeviceEnumerator), (void**)&pDeviceEnumerator);
	if (FAILED(hr)) return false;
	hr = pDeviceEnumerator->GetDefaultAudioEndpoint(eRender, eMultimedia, &pDevice);
	if (FAILED(hr)) return false;
	hr = pDevice->Activate(__uuidof(IAudioEndpointVolume), CLSCTX_ALL, NULL, (void**)&pAudioEndpointVolume);
	if (FAILED(hr)) return false;
	hr = pDevice->Activate(__uuidof(IAudioClient), CLSCTX_ALL, NULL, (void**)&pAudioClient);
	if (FAILED(hr)) return false;

	inited = true;
	return true;
}
bool UnInitVolume() {
  if(inited) {
    pAudioClient->Release();
    pAudioEndpointVolume->Release();
    pDevice->Release();
    pDeviceEnumerator->Release();
    pAudioClient = nullptr;
    pAudioEndpointVolume = nullptr;
    pDevice = nullptr;
    pAudioClient = nullptr;
    inited = false;
    return true;
  }
  return false;
}

bool SetVolume(int volume)
{
	if (inited) {
		float fVolume;
		fVolume = volume / 100.0f;
		hr = pAudioEndpointVolume->SetMasterVolumeLevelScalar(fVolume, &GUID_NULL);
		if (FAILED(hr)) return false;
		return true;
	}
	return false;
}
int GetVolume()
{
	if (inited) {

		float fVolume;
		hr = pAudioEndpointVolume->GetMasterVolumeLevelScalar(&fVolume);
		if (FAILED(hr)) return 0;

		int intVolume = fVolume * 100 + 1;
		if (fVolume > 100)
		{
			fVolume = 100;
		}
		return fVolume;
	}
	return 0;
}
