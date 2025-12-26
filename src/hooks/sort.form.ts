import { createFormHook } from '@tanstack/react-form'

import {
  DateField,
  Select,
  SubscribeButton,
  TagListField,
  TextArea,
  TextField,
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
