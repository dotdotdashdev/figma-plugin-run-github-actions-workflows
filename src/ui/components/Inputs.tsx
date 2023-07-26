import { Props, Text, Textbox, TextboxProps, VerticalSpace } from '@create-figma-plugin/ui'
import { Fragment, h, JSX } from 'preact'

import { useSettings } from '../../Settings'
import { Title } from './Title'

export function Inputs(): JSX.Element {
  const [settings, dispatch] = useSettings()

  return (
    <Fragment>
      <Title>Inputs</Title>

      <VerticalSpace space='large' />

      {/* <Input
        label='fileKey'
        required
        onValueInput={fileKey => dispatch({ type: 'EDIT_FILE_KEY', fileKey })}
        value={settings.fileKey || ''} /> */}
      <Input
        label='User'
        required
        value={JSON.stringify(settings.currentUser)}
        disabled />
      <Input
        label='Branch URL'
        required
        onValueInput={branchUrl => dispatch({ type: 'EDIT_BRANCH_URL', branchUrl })}
        value={settings.branchUrl || ''} />
      <Input
        label='Title'
        required
        onValueInput={title => dispatch({ type: 'EDIT_TITLE', title })}
        value={settings.title || ''} />
      <Input
        label='Description'
        required
        onValueInput={description => dispatch({ type: 'EDIT_DESCRIPTION', description })}
        value={settings.description || ''} />

      <Input
        label='Page'
        required
        value={JSON.stringify(settings.page) || ''}
        disabled />

      <Input
        label='Selection'
        required
        value={JSON.stringify(settings.selection)}
        disabled />
    </Fragment>
  )
}

function Input<Name extends string>({ label, ...textboxProps }: Props<HTMLInputElement, TextboxProps<Name>>): JSX.Element {
  return (
    <Fragment>
      <div>
        {
          label && (
            <Fragment>
              <Text muted>{label}</Text>
              <VerticalSpace space='small' />
            </Fragment>
          )
        }
        <Textbox {...textboxProps} />
        <VerticalSpace space='medium' />
      </div>
    </Fragment>
  )
}
