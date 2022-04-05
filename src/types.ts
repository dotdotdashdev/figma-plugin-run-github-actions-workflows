import { EventHandler } from '@create-figma-plugin/utilities'
import { Settings } from './Settings'

export interface LoadSettingsHandler extends EventHandler {
  name: 'LOAD_SETTINGS'
  handler: (settings: Settings) => void
}

export interface SaveSettingsHandler extends EventHandler {
  name: 'SAVE_SETTINGS'
  handler: (settings: Settings) => void
}

export interface RequestInfoHandler extends EventHandler {
  name: 'REQUEST_INFO'
  handler: () => void
}

export interface InfoResponseHandler extends EventHandler {
  name: 'INFO_RESPONSE'
  handler: (pageName: string, selection: Selection[]) => void
}

export type Selection = {
  id: SceneNode['id']
  name: SceneNode['name']
}