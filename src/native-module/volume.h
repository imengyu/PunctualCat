#pragma once
#include <windows.h> 
#include <mmdeviceapi.h> 
#include <endpointvolume.h>
#include <audioclient.h>

bool InitVolume();
bool UnInitVolume();

bool SetVolume(int volume);
int GetVolume();
