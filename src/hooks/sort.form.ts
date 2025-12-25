import { createFormHook } from '@tanstack/react-form'

import {
  Select,
  SubscribeButton,
  TextArea,
  TextField,
  DateField,
  TagListField,
} from '../components/FormComponents'
import { fieldContext, formContext } from './sort.form-context'

export const { useAppForm } = createFormHook({
  fieldComponents: {
    TextField,
    Select,
    TextArea,
    DateField,
    TagListField,
  },
  formComponents: {
    SubscribeButton,
  },
  fieldContext,
  formContext,
})
