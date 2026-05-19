/* global H5P, H5PEditor */
/**
 * CFRD editor: proportional task size via native select + dimensions sync.
 * Sync runs only on user-driven changes (not on init) to keep Lumi preview stable.
 */
(function ($) {
  'use strict';

  var BASE_WIDTH = 620;
  var BASE_HEIGHT = 310;
  var SCALE_STEPS = [1, 1.25, 1.5, 1.75, 2];

  var APPEARANCE_DEFAULTS = {
    canvasBackground: '#ffffff',
    dropZoneBackground: '#f5f5f5',
    dropZoneBorder: '#666666',
    dropZoneHoverBackground: '#edd6e9',
    draggableBackground: '#dddddd',
    draggableBorder: '#c6c6c6',
    draggableHoverBackground: '#edd6e9',
    draggableHoverBorder: '#d4bed8',
    draggableDroppedBackground: '#cee0f4',
    draggableDroppedBorder: '#a9c3d0',
    draggableDroppedColor: '#1a4473',
    draggableCorrectBackground: '#9dd8bb',
    draggableCorrectBorder: '#9dd8bb',
    draggableCorrectColor: '#255c41',
    draggableWrongBackground: '#f7d0d0',
    draggableWrongBorder: '#f7d0d0',
    draggableWrongColor: '#b71c1c'
  };

  var APPEARANCE_CSS_VARS = {
    canvasBackground: '--dq-canvas-bg',
    dropZoneBackground: '--dq-dropzone-bg',
    dropZoneBorder: '--dq-dropzone-border',
    dropZoneHoverBackground: '--dq-dropzone-hover-bg',
    draggableBackground: '--dq-draggable-bg',
    draggableBorder: '--dq-draggable-border',
    draggableHoverBackground: '--dq-draggable-hover-bg',
    draggableHoverBorder: '--dq-draggable-hover-border',
    draggableDroppedBackground: '--dq-draggable-dropped-bg',
    draggableDroppedBorder: '--dq-draggable-dropped-border',
    draggableDroppedColor: '--dq-draggable-dropped-color',
    draggableCorrectBackground: '--dq-draggable-correct-bg',
    draggableCorrectBorder: '--dq-draggable-correct-border',
    draggableCorrectColor: '--dq-draggable-correct-color',
    draggableWrongBackground: '--dq-draggable-wrong-bg',
    draggableWrongBorder: '--dq-draggable-wrong-border',
    draggableWrongColor: '--dq-draggable-wrong-color'
  };

  function normalizeScale(value) {
    var scale = parseFloat(value);
    var closest;
    var minDiff;
    var i;
    var diff;

    if (isNaN(scale)) {
      return 1;
    }

    closest = SCALE_STEPS[0];
    minDiff = Math.abs(scale - closest);

    for (i = 1; i < SCALE_STEPS.length; i++) {
      diff = Math.abs(scale - SCALE_STEPS[i]);
      if (diff < minDiff) {
        minDiff = diff;
        closest = SCALE_STEPS[i];
      }
    }

    return closest;
  }

  function getSizeForScale(scale) {
    return {
      width: Math.round(BASE_WIDTH * scale),
      height: Math.round(BASE_HEIGHT * scale)
    };
  }

  function isTruthy(value) {
    return value === true || value === 1 || value === '1' || value === 'true';
  }

  function getSettingsGroup(questionParent) {
    return H5PEditor.findField('settings', questionParent);
  }

  function getSizeField(questionParent) {
    var settings = getSettingsGroup(questionParent);

    if (!settings) {
      return null;
    }

    return H5PEditor.findField('size', settings);
  }

  function getScaleField(questionParent) {
    var settings = getSettingsGroup(questionParent);

    if (!settings) {
      return null;
    }

    return H5PEditor.findField('taskSizeScale', settings);
  }

  function getUseScaledField(questionParent) {
    var settings = getSettingsGroup(questionParent);

    if (!settings) {
      return null;
    }

    return H5PEditor.findField('useScaledTaskSize', settings);
  }

  function isScaledModeEnabled(questionParent, useScaledValue) {
    var settings;
    var value = useScaledValue;

    if (value === undefined) {
      settings = getSettingsGroup(questionParent);
      if (settings && settings.params && settings.params.useScaledTaskSize !== undefined) {
        value = settings.params.useScaledTaskSize;
      }
      else {
        value = true;
      }
    }

    return isTruthy(value);
  }

  function applySizeToDimensionsField(sizeField, width, height) {
    var value;
    var i;

    if (!sizeField) {
      return;
    }

    value = {
      width: width,
      height: height
    };

    sizeField.params = value;
    sizeField.setValue(sizeField.field, value);

    if (sizeField.$inputs) {
      sizeField.$inputs.filter(':eq(0)').val(width);
      sizeField.$inputs.filter(':eq(1)').val(height);
    }

    if (sizeField.changes) {
      for (i = 0; i < sizeField.changes.length; i++) {
        sizeField.changes[i](width, height);
      }
    }
  }

  function setDimensionsLocked(sizeField, locked) {
    if (!sizeField || !sizeField.$inputs) {
      return;
    }

    sizeField.$inputs.prop('disabled', locked);
  }

  function updateTaskSizeScaleUI(questionParent, useScaledValue) {
    var scaled = isScaledModeEnabled(questionParent, useScaledValue);
    var sizeField = getSizeField(questionParent);
    var scaleField = getScaleField(questionParent);

    setDimensionsLocked(sizeField, scaled);

    if (scaleField && scaleField.$item) {
      if (scaled) {
        scaleField.$item.show();
      }
      else {
        scaleField.$item.hide();
      }
    }
  }

  function applyScaleToSizeField(questionParent, scaleValue) {
    var size;
    var scale;
    var sizeField;

    if (!isScaledModeEnabled(questionParent)) {
      return;
    }

    sizeField = getSizeField(questionParent);
    if (!sizeField) {
      return;
    }

    scale = normalizeScale(scaleValue);
    size = getSizeForScale(scale);
    applySizeToDimensionsField(sizeField, size.width, size.height);
  }

  function bindScaleSelectChange(questionParent) {
    var scaleField = getScaleField(questionParent);

    if (!scaleField || !scaleField.$item || scaleField._cfrdUserChangeBound) {
      return;
    }

    scaleField._cfrdUserChangeBound = true;
    scaleField.$item.find('select').on('change', function () {
      applyScaleToSizeField(questionParent, $(this).val());
    });
  }

  function mergeAppearance(appearance) {
    var merged = {};
    var key;

    for (key in APPEARANCE_DEFAULTS) {
      if (Object.prototype.hasOwnProperty.call(APPEARANCE_DEFAULTS, key)) {
        merged[key] = APPEARANCE_DEFAULTS[key];
      }
    }

    if (!appearance) {
      return merged;
    }

    for (key in APPEARANCE_DEFAULTS) {
      if (Object.prototype.hasOwnProperty.call(APPEARANCE_DEFAULTS, key) &&
          appearance[key] !== undefined &&
          appearance[key] !== null &&
          appearance[key] !== '') {
        merged[key] = appearance[key];
      }
    }

    return merged;
  }

  function applyAppearanceVars($container, appearance) {
    var merged = mergeAppearance(appearance);
    var key;
    var i;
    var el;

    if (!$container || !$container.length) {
      return;
    }

    for (i = 0; i < $container.length; i++) {
      el = $container[i];

      if (!el || !el.style) {
        continue;
      }

      for (key in APPEARANCE_CSS_VARS) {
        if (Object.prototype.hasOwnProperty.call(APPEARANCE_CSS_VARS, key)) {
          el.style.setProperty(APPEARANCE_CSS_VARS[key], merged[key]);
        }
      }
    }
  }

  function applyEditorAppearance(questionParent) {
    var settings = getSettingsGroup(questionParent);
    var taskWidget = H5PEditor.findField('task', questionParent);
    var appearance;

    if (!taskWidget || !taskWidget.$editor || !taskWidget.$editor.length) {
      return;
    }

    appearance = settings && settings.params && settings.params.appearance;
    applyAppearanceVars(taskWidget.$editor, appearance);
  }

  function setupAppearanceSync(questionParent) {
    var appearanceFollowCount = 0;

    if (!questionParent || questionParent._cfrdAppearanceSyncSetup) {
      return;
    }

    questionParent._cfrdAppearanceSyncSetup = true;

    H5PEditor.followField(questionParent, 'settings/appearance', function () {
      appearanceFollowCount += 1;

      if (appearanceFollowCount === 1) {
        applyEditorAppearance(questionParent);
        return;
      }

      applyEditorAppearance(questionParent);
    });
  }

  function setupTaskSizeScaleSync(questionParent) {
    var scaleFollowCount = 0;
    var useScaledFollowCount = 0;

    if (!questionParent || questionParent._cfrdTaskSizeSyncSetup) {
      return;
    }

    questionParent._cfrdTaskSizeSyncSetup = true;

    H5PEditor.followField(questionParent, 'settings/useScaledTaskSize', function (value) {
      useScaledFollowCount += 1;
      updateTaskSizeScaleUI(questionParent, value);

      if (useScaledFollowCount > 1 && isTruthy(value)) {
        var scaleField = getScaleField(questionParent);
        var currentScale = scaleField && scaleField.params !== undefined ?
          scaleField.params :
          '1';
        applyScaleToSizeField(questionParent, currentScale);
      }
    });

    H5PEditor.followField(questionParent, 'settings/taskSizeScale', function (value) {
      scaleFollowCount += 1;
      bindScaleSelectChange(questionParent);

      if (scaleFollowCount === 1) {
        updateTaskSizeScaleUI(questionParent);
        return;
      }

      applyScaleToSizeField(questionParent, value);
    });
  }

  function patchDragQuestionWidget() {
    var Original = H5PEditor.DragQuestionCFRD;

    if (!Original || Original._cfrdSizeSyncPatched) {
      return;
    }

    H5PEditor.DragQuestionCFRD = function (parent, field, params, setValue) {
      Original.call(this, parent, field, params, setValue);
      setupTaskSizeScaleSync(parent);
      setupAppearanceSync(parent);
    };

    H5PEditor.DragQuestionCFRD.prototype = Original.prototype;
    H5PEditor.DragQuestionCFRD._cfrdSizeSyncPatched = true;
    H5PEditor.widgets.dragQuestionCFRD = H5PEditor.DragQuestionCFRD;
  }

  patchDragQuestionWidget();

})(H5P.jQuery);
