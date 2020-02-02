import React from 'react';
import { withRouter } from 'react-router-dom';

import isFormikForm from '../isFormikForm';
import NoPathsHelpSnippet from '../HelpSnippets/NoPathsHelpSnippet';

import ChartForm from '../Widgets/GLeanChartWidget/ChartForm/ChartForm';
import LastValueForm from '../Widgets/LastValueWidget/LastValueForm';
import TopNWidgetForm from '../Widgets/TopNWidget/TopNWidgetForm';

import './WidgetForm.scss';

const WIDGET_TYPES = [
  { type: 'chart', icon: 'area-chart', label: 'chart', form: ChartForm },
  { type: 'lastvalue', icon: 'thermometer-half', label: 'last value', form: LastValueForm },
  { type: 'topn', icon: 'trophy', label: 'top N', form: TopNWidgetForm },
];

class WidgetForm extends React.Component {
  static validate = values => {
    if (!values.type) {
      return {
        type: 'widget type not selected',
      };
    }
    const selectedWidgetType = WIDGET_TYPES.find(wt => wt.type === values.type);
    if (selectedWidgetType['form'].validate) {
      const validationResult = selectedWidgetType['form'].validate(values.content);
      // We are not sure what we will receive, but if it is empty, we want to receive an empty object (which is
      // what formik expects). So we are a bit careful when checking:
      if (Array.isArray(validationResult) && validationResult.length === 0) {
        return {};
      } else if (typeof validationResult === 'object' && Object.keys(validationResult).length === 0) {
        return {};
      } else if (!validationResult) {
        return {};
      }
      // there was an error, return non-empty object:
      return {
        content: validationResult,
      };
    }
    return {};
  };

  static convertFetchedFormValues = fetchedFormValues => {
    return {
      ...fetchedFormValues,
      content: JSON.parse(fetchedFormValues.content),
      id: undefined,
      x: undefined,
      y: undefined,
      w: undefined,
      h: undefined,
    };
  };

  static fixValuesBeforeSubmit = formValues => {
    return {
      ...formValues,
      content: JSON.stringify(formValues.content),
    };
  };

  changeWidgetType = widgetType => {
    this.props.setFieldValue('type', widgetType);
    // initialize to default values:
    const selectedWidgetType = WIDGET_TYPES.find(wt => wt.type === widgetType);
    this.props.setFieldValue('content', selectedWidgetType['form'].DEFAULT_FORM_CONTENT);
  };

  render() {
    const {
      values: { type, title = '', content },
      onChange,
      onBlur,
      setFieldValue,
      lockWidgetType,
    } = this.props;

    const selectedWidgetType = WIDGET_TYPES.find(wt => wt.type === type);
    const WidgetTypeForm = selectedWidgetType ? selectedWidgetType.form : null;
    return (
      <div className="widget-form">
        <NoPathsHelpSnippet />

        <div className="field">
          <label>Widget title:</label>
          <input type="text" name="title" value={title} onChange={onChange} onBlur={onBlur} />
        </div>

        {!lockWidgetType && (
          <div className="field">
            <label>Type:</label>
            {WIDGET_TYPES.map(wt => (
              <i
                key={wt.type}
                className={`fa fa-${wt.icon} widget-type ${type === wt.type && 'selected'}`}
                onClick={() => this.changeWidgetType(wt.type)}
              />
            ))}
          </div>
        )}

        {WidgetTypeForm && (
          <div className="widget-type-form nested-field">
            <WidgetTypeForm
              onChange={onChange}
              onBlur={onBlur}
              setFieldValue={setFieldValue}
              content={content ? content : {}}
            />
          </div>
        )}
      </div>
    );
  }
}

export default isFormikForm(withRouter(WidgetForm));
