import {
  Container,
  Divider,
  IconCross32,
  IconPlay32,
  Inline,
  LoadingIndicator,
  Text,
  Textbox,
  VerticalSpace
} from '@create-figma-plugin/ui'
import { emit, on } from '@create-figma-plugin/utilities'
import { Fragment, FunctionalComponent, h } from 'preact'
import { useCallback, useEffect } from 'preact/hooks'

import { ButtonIcon } from '../ButtonIcon'
import { GitHubAction, useSettings } from '../Settings'
import { InfoResponseHandler, RequestInfoHandler } from '../types'
import { ManageAction } from './ManageAction'


export function Plugin() {
  const [ settings, dispatch ] = useSettings()

  useEffect(function getInfo() {
    on<InfoResponseHandler>('INFO_RESPONSE', (pageName, selection) => {
      dispatch({ type: 'EDIT_SELECTION', pageName, selection })
    })

    const interval = setInterval(() => {
      emit<RequestInfoHandler>('REQUEST_INFO')
    }, 100)

    return () => {
      clearInterval(interval)
    }
  }, [])

  function isValidAction(action: GitHubAction) {
    // https://docs.github.com/en/rest/reference/actions#get-a-workflow
    return fetch(`https://api.github.com/repos/${action.owner}/${action.repo}/actions/workflows/${action.workflow_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${action.access_token}`,
        'Accept': 'application/vnd.github.v3+json'
      },
    })
      .then(response => response.json())
      .then(json => json.state === 'active')
  }

  const handleRunGitHubAction = useCallback((action: GitHubAction) => {
    console.group('Info')
      console.log('fileKey', settings.fileKey)
      console.log('action', action)
      console.log('pageName', settings.pageName)
      console.log('selection', settings.selection)
    console.groupEnd()
  }, [settings])

  const handleAddGitHubAction = useCallback(async (action: GitHubAction) => {
    const isValid = await isValidAction(action)

    if (isValid) {
      dispatch({ type: 'ADD_ACTION', payload: action })
    }

    return isValid;
  }, [])

  const handleEditGitHubAction = useCallback(async(index: number, action: GitHubAction) => {
    const isValid = await isValidAction(action)

    if (isValid) {
      dispatch({ type: 'EDIT_ACTION', index, payload: action })
    }

    return isValid;
  }, [])

  const handleRemoveGitHubAction = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_ACTION', index })
  }, [])

  if (!settings) {
    return <LoadingIndicator />
  }

  return (
    <Container>
      <VerticalSpace space="extraLarge" />

      <FileKey />
      <Info />

      <Divider />

      {
        settings?.actions.map((action, index) => (
          <Fragment>
            <VerticalSpace space="extraLarge" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Text style={{ flex: '1 1 auto' }}><a target='_blank' href={`https://github.com/${action.owner}/${action.repo}/actions/workflows/${action.workflow_id}`}>{action.name}</a></Text>
              <ButtonIcon onClick={() => handleRunGitHubAction(action)}><IconPlay32 /></ButtonIcon>
              <ManageAction action={action} onSubmit={(action) => handleEditGitHubAction(index, action)} />
              <ButtonIcon destructive secondary onClick={() => handleRemoveGitHubAction(index)}><IconCross32 /></ButtonIcon>
            </div>
          </Fragment>
        ))
      }

      <VerticalSpace space="extraLarge" />
      <Inline space="extraSmall" style={{ textAlign: 'right' }}>
        <ManageAction onSubmit={(action) => handleAddGitHubAction(action)} />
      </Inline>
      <VerticalSpace space="small" />

    </Container>
  )
}

const FileKey: FunctionalComponent = () => {
  const [settings, dispatch] = useSettings()

  return (
    <Fragment>
      <Text muted>File key</Text>
      <VerticalSpace space="small" />
      <Textbox
        required
        onValueInput={(value) => dispatch({ type: 'EDIT_FILE_KEY', fileKey: value })}
        value={settings.fileKey || ''}
      />
      <VerticalSpace space="extraLarge" />
    </Fragment>
  )
}

const Info: FunctionalComponent = () => {
  const [settings] = useSettings()

  return (
    <Fragment>
      <div>
        <Text muted>Page name</Text>
        <VerticalSpace space="small" />
        <Textbox required value={settings.pageName || ''} disabled />
        <VerticalSpace space="extraLarge" />
      </div>
      <div>
        <Text muted>Selection</Text>
        <VerticalSpace space="small" />
        <Textbox required value={JSON.stringify(settings.selection)} disabled />
        <VerticalSpace space="extraLarge" />
      </div>
    </Fragment>
  )
}
