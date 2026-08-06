/* global H5P, H5PEditor */
/**
 * CFRD editor: proportional task size via native select + dimensions sync.
 * Applies scale on init so Task tab has size (needed when embedded in CP),
 * and on later user-driven scale / mode changes.
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
    dropZoneBorderRadius: '0.25em',
    dropZoneBorderWidth: '0.1em',
    dropZoneBorderStyle: 'solid',
    dropZoneHoverBackground: '#edd6e9',
    dropZoneHoverBorder: '#666666',
    dropZoneHoverBorderStyle: 'solid',
    dropZoneLabelColor: '#333333',
    zoneIconColor: '#333333',
    dropZoneBordersEnabled: '1',
    draggableBackground: '#dddddd',
    draggableBorder: '#c6c6c6',
    draggableColor: '#333333',
    draggableHoverBackground: '#edd6e9',
    draggableHoverBorder: '#d4bed8',
    draggableHoverColor: '#663366',
    draggableDroppedBackground: '#cee0f4',
    draggableDroppedBorder: '#a9c3d0',
    draggableDroppedColor: '#1a4473',
    draggableCorrectBackground: '#9dd8bb',
    draggableCorrectBorder: '#9dd8bb',
    draggableCorrectColor: '#255c41',
    draggableWrongBackground: '#f7d0d0',
    draggableWrongBorder: '#f7d0d0',
    draggableWrongColor: '#b71c1c',
    draggableBorderRadius: '0.25em',
    draggableBorderWidth: '0',
    draggableBorderStyle: 'none',
    draggableBordersEnabled: '0'
  };

  var VALID_BORDER_STYLES = ['solid', 'dashed', 'dotted', 'double'];

  var BORDER_WIDTH_MAX = 0.5;

  var BORDER_RADIUS_DEFAULT = 0.25;

  var BORDER_RADIUS_MAX = 2;

  var DROP_ZONE_BASE_KEYS = [
    'dropZoneBackground',
    'dropZoneHoverBackground',
    'dropZoneLabelColor',
    'zoneIconColor'
  ];

  var DROP_ZONE_BORDER_COLOR_KEYS = [
    'dropZoneBorder',
    'dropZoneHoverBorder'
  ];

  var DROP_ZONE_COLOR_KEYS = DROP_ZONE_BASE_KEYS.concat(DROP_ZONE_BORDER_COLOR_KEYS);

  var DRAGGABLE_BORDER_COLOR_KEYS = [
    'draggableBorder',
    'draggableHoverBorder',
    'draggableDroppedBorder',
    'draggableCorrectBorder',
    'draggableWrongBorder'
  ];

  var DRAGGABLE_TEXT_COLOR_KEYS = [
    'draggableColor',
    'draggableHoverColor',
    'draggableDroppedColor',
    'draggableCorrectColor',
    'draggableWrongColor'
  ];

  var DRAGGABLE_BACKGROUND_KEYS = [
    'draggableBackground',
    'draggableHoverBackground',
    'draggableDroppedBackground',
    'draggableCorrectBackground',
    'draggableWrongBackground'
  ];

  var DRAGGABLE_GRADIENT_STATES = [
    {
      solidKey: 'draggableBackground',
      stateKey: 'normal',
      legacyFillKey: 'draggableBackgroundFill',
      defaults: { colorStart: '#dddddd', colorEnd: '#bbbbbb' }
    },
    {
      solidKey: 'draggableHoverBackground',
      stateKey: 'hover',
      legacyFillKey: 'draggableHoverBackgroundFill',
      defaults: { colorStart: '#edd6e9', colorEnd: '#d4bed8' }
    },
    {
      solidKey: 'draggableDroppedBackground',
      stateKey: 'dropped',
      legacyFillKey: 'draggableDroppedBackgroundFill',
      defaults: { colorStart: '#cee0f4', colorEnd: '#a9c3d0' }
    },
    {
      solidKey: 'draggableCorrectBackground',
      stateKey: 'correct',
      legacyFillKey: 'draggableCorrectBackgroundFill',
      defaults: { colorStart: '#9dd8bb', colorEnd: '#7bc9a8' }
    },
    {
      solidKey: 'draggableWrongBackground',
      stateKey: 'wrong',
      legacyFillKey: 'draggableWrongBackgroundFill',
      defaults: { colorStart: '#f7d0d0', colorEnd: '#e8a8a8' }
    }
  ];

  /** Fields always mounted in the editor (not behind showWhen). */
  var APPEARANCE_FOLLOW_PATHS_ALWAYS = [
    'settings/appearance/canvasBackground',
    'settings/appearance/dropZoneColors/dropZoneBackground',
    'settings/appearance/dropZoneColors/dropZoneHoverBackground',
    'settings/appearance/dropZoneColors/useDropZoneBorder',
    'settings/appearance/dropZoneColors/dropZoneLabelColor',
    'settings/appearance/dropZoneColors/zoneIconColor',
    'settings/appearance/draggableColors/draggableColor',
    'settings/appearance/draggableColors/draggableHoverColor',
    'settings/appearance/draggableColors/draggableDroppedColor',
    'settings/appearance/draggableColors/draggableCorrectColor',
    'settings/appearance/draggableColors/draggableWrongColor'
  ];

  /** Mounted only when useGradientBackground is false. */
  var APPEARANCE_FOLLOW_PATHS_SOLID = [
    'settings/appearance/draggableColors/solidBackgrounds/draggableBackground',
    'settings/appearance/draggableColors/solidBackgrounds/draggableHoverBackground',
    'settings/appearance/draggableColors/solidBackgrounds/draggableDroppedBackground',
    'settings/appearance/draggableColors/solidBackgrounds/draggableCorrectBackground',
    'settings/appearance/draggableColors/solidBackgrounds/draggableWrongBackground'
  ];

  /** Mounted only when useGradientBackground is true. */
  var APPEARANCE_FOLLOW_PATHS_GRADIENT = [
    'settings/appearance/draggableColors/gradientBackgrounds/gradientAngle',
    'settings/appearance/draggableColors/gradientBackgrounds/normal/colorStart',
    'settings/appearance/draggableColors/gradientBackgrounds/normal/colorEnd',
    'settings/appearance/draggableColors/gradientBackgrounds/hover/colorStart',
    'settings/appearance/draggableColors/gradientBackgrounds/hover/colorEnd',
    'settings/appearance/draggableColors/gradientBackgrounds/dropped/colorStart',
    'settings/appearance/draggableColors/gradientBackgrounds/dropped/colorEnd',
    'settings/appearance/draggableColors/gradientBackgrounds/correct/colorStart',
    'settings/appearance/draggableColors/gradientBackgrounds/correct/colorEnd',
    'settings/appearance/draggableColors/gradientBackgrounds/wrong/colorStart',
    'settings/appearance/draggableColors/gradientBackgrounds/wrong/colorEnd'
  ];

  /** Mounted only when useDraggableBorder is true. */
  var APPEARANCE_FOLLOW_PATHS_BORDER = [
    'settings/appearance/draggableColors/borderSettings/borderStyle',
    'settings/appearance/draggableColors/borderSettings/borderWidth',
    'settings/appearance/draggableColors/borderSettings/borderColors/draggableBorder',
    'settings/appearance/draggableColors/borderSettings/borderColors/draggableHoverBorder',
    'settings/appearance/draggableColors/borderSettings/borderColors/draggableDroppedBorder',
    'settings/appearance/draggableColors/borderSettings/borderColors/draggableCorrectBorder',
    'settings/appearance/draggableColors/borderSettings/borderColors/draggableWrongBorder'
  ];

  /** Mounted only when useDropZoneBorder is true. */
  var APPEARANCE_FOLLOW_PATHS_DROP_ZONE_BORDER = [
    'settings/appearance/dropZoneColors/borderSettings/borderWidth',
    'settings/appearance/dropZoneColors/borderSettings/normal/borderStyle',
    'settings/appearance/dropZoneColors/borderSettings/normal/borderColor',
    'settings/appearance/dropZoneColors/borderSettings/hover/borderStyle',
    'settings/appearance/dropZoneColors/borderSettings/hover/borderColor'
  ];

  var APPEARANCE_CSS_VARS = {
    canvasBackground: '--dq-canvas-bg',
    dropZoneBackground: '--dq-dropzone-bg',
    dropZoneBorder: '--dq-dropzone-border',
    dropZoneBorderRadius: '--dq-dropzone-border-radius',
    dropZoneBorderWidth: '--dq-dropzone-border-width',
    dropZoneBorderStyle: '--dq-dropzone-border-style',
    dropZoneHoverBackground: '--dq-dropzone-hover-bg',
    dropZoneHoverBorder: '--dq-dropzone-hover-border',
    dropZoneHoverBorderStyle: '--dq-dropzone-hover-border-style',
    dropZoneLabelColor: '--dq-dropzone-label-color',
    zoneIconColor: '--dq-zone-icon-color',
    dropZoneBordersEnabled: '--dq-dropzone-borders-enabled',
    draggableBackground: '--dq-draggable-bg',
    draggableBorder: '--dq-draggable-border',
    draggableColor: '--dq-draggable-color',
    draggableHoverBackground: '--dq-draggable-hover-bg',
    draggableHoverBorder: '--dq-draggable-hover-border',
    draggableHoverColor: '--dq-draggable-hover-color',
    draggableDroppedBackground: '--dq-draggable-dropped-bg',
    draggableDroppedBorder: '--dq-draggable-dropped-border',
    draggableDroppedColor: '--dq-draggable-dropped-color',
    draggableCorrectBackground: '--dq-draggable-correct-bg',
    draggableCorrectBorder: '--dq-draggable-correct-border',
    draggableCorrectColor: '--dq-draggable-correct-color',
    draggableWrongBackground: '--dq-draggable-wrong-bg',
    draggableWrongBorder: '--dq-draggable-wrong-border',
    draggableWrongColor: '--dq-draggable-wrong-color',
    draggableBorderRadius: '--dq-draggable-border-radius',
    draggableBorderWidth: '--dq-draggable-border-width',
    draggableBorderStyle: '--dq-draggable-border-style',
    draggableBordersEnabled: '--dq-draggable-borders-enabled'
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

  function resolveFollowFieldContext(questionParent, path) {
    var parent = questionParent;
    var segments;
    var i;
    var field;

    if (typeof path !== 'string' || !path) {
      return null;
    }

    segments = path.split('/');

    if (segments.length === 1) {
      return {
        parent: questionParent,
        path: path
      };
    }

    for (i = 0; i < segments.length - 1; i++) {
      if (!segments[i]) {
        return null;
      }

      try {
        field = H5PEditor.findField(segments[i], parent);
      }
      catch (err) {
        return null;
      }

      if (!field) {
        return null;
      }

      parent = field;
    }

    return {
      parent: parent,
      path: segments[segments.length - 1]
    };
  }

  /**
   * Register followField only when the field exists (showWhen may unmount branches).
   *
   * @param {Object} questionParent
   * @param {string} path
   * @param {Function} callback
   */
  function safeFollowField(questionParent, path, callback) {
    var field;
    var context = resolveFollowFieldContext(questionParent, path);

    if (!context) {
      return;
    }

    try {
      field = H5PEditor.findField(context.path, context.parent);
    }
    catch (err) {
      return;
    }

    if (!field) {
      return;
    }

    try {
      H5PEditor.followField(context.parent, context.path, callback);
    }
    catch (err) {
      // Field removed by showWhen after findField; ignore.
    }
  }

  /**
   * Bind directly to field inputs for controls that exist but cannot be safely
   * observed through H5PEditor.followField.
   *
   * @param {Object} questionParent
   * @param {string} path
   * @param {Function} callback
   */
  function safeBindFieldInputs(questionParent, path, callback) {
    var field;
    var context = resolveFollowFieldContext(questionParent, path);
    var eventNamespace;
    var $inputs;

    if (!context) {
      return;
    }

    try {
      field = H5PEditor.findField(context.path, context.parent);
    }
    catch (err) {
      return;
    }

    if (!field) {
      return;
    }

    $inputs = field.$input && field.$input.length ?
      field.$input :
      (field.$item ? field.$item.find('input, textarea, select') : $());

    if (!$inputs || !$inputs.length) {
      return;
    }

    eventNamespace = '.cfrdAppearance' + path.replace(/[^a-z0-9]+/gi, '-');
    $inputs.off('input' + eventNamespace + ' change' + eventNamespace);
    $inputs.on('input' + eventNamespace + ' change' + eventNamespace, callback);
  }

  /**
   * @param {Object} questionParent
   * @param {string[]} paths
   * @param {Function} callback
   */
  function safeFollowFields(questionParent, paths, callback) {
    var i;

    for (i = 0; i < paths.length; i++) {
      safeFollowField(questionParent, paths[i], callback);
    }
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

  /**
   * Select/Boolean widgets store the live value in .value; followField reads
   * .params (often undefined). Prefer .value, then group params, then the DOM.
   *
   * @param {Object|null} field
   * @param {*} fallback
   * @returns {*}
   */
  function readWidgetValue(field, fallback) {
    var settings;

    if (!field) {
      return fallback;
    }

    if (field.value !== undefined) {
      return field.value;
    }

    if (field.params !== undefined) {
      return field.params;
    }

    if (field.$select && field.$select.length) {
      return field.$select.val();
    }

    if (field.$input && field.$input.length) {
      if (field.$input.attr('type') === 'checkbox') {
        return field.$input.is(':checked');
      }
      return field.$input.val();
    }

    settings = field.parent && field.parent.params;
    if (settings && field.field && field.field.name && settings[field.field.name] !== undefined) {
      return settings[field.field.name];
    }

    return fallback;
  }

  function getCurrentScaleValue(questionParent) {
    return readWidgetValue(getScaleField(questionParent), '1');
  }

  function getCurrentUseScaledValue(questionParent) {
    return readWidgetValue(getUseScaledField(questionParent), true);
  }

  function isScaledModeEnabled(questionParent, useScaledValue) {
    var value = useScaledValue;

    if (value === undefined || value === null) {
      value = getCurrentUseScaledValue(questionParent);
    }

    return isTruthy(value);
  }

  /**
   * Push size into the Task widget. followField('settings/size') often never
   * registers when Drag Question is embedded in Course Presentation, so the
   * canvas stays on noTaskSize even though the Dimensions inputs look correct.
   *
   * @param {Object} questionParent Wizard / question group
   * @param {number} width
   * @param {number} height
   */
  function notifyTaskWidgetSize(questionParent, width, height) {
    var taskWidget;

    if (!questionParent || width === undefined || height === undefined) {
      return;
    }

    try {
      taskWidget = H5PEditor.findField('task', questionParent);
    }
    catch (err) {
      taskWidget = null;
    }

    if (taskWidget && typeof taskWidget.setSize === 'function') {
      taskWidget.setSize({
        width: width,
        height: height
      });
    }
  }

  function applySizeToDimensionsField(sizeField, width, height) {
    var value;
    var i;
    var questionParent;

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

    // settings Group → wizard (question parent)
    questionParent = sizeField.parent && sizeField.parent.parent;
    notifyTaskWidgetSize(questionParent, width, height);
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
    var $select;

    if (!scaleField || scaleField._cfrdUserChangeBound) {
      return;
    }

    $select = scaleField.$select && scaleField.$select.length ?
      scaleField.$select :
      (scaleField.$item ? scaleField.$item.find('select') : $());

    if (!$select || !$select.length) {
      return;
    }

    scaleField._cfrdUserChangeBound = true;
    $select.on('change', function () {
      applyScaleToSizeField(questionParent, $(this).val());
    });
  }

  function bindUseScaledCheckboxChange(questionParent) {
    var useScaledField = getUseScaledField(questionParent);
    var $input;

    if (!useScaledField || useScaledField._cfrdUserChangeBound) {
      return;
    }

    $input = useScaledField.$input && useScaledField.$input.length ?
      useScaledField.$input :
      (useScaledField.$item ? useScaledField.$item.find('input[type="checkbox"]') : $());

    if (!$input || !$input.length) {
      return;
    }

    useScaledField._cfrdUserChangeBound = true;
    $input.on('change', function () {
      var enabled = $(this).is(':checked');
      updateTaskSizeScaleUI(questionParent, enabled);
      if (enabled) {
        applyScaleToSizeField(questionParent, getCurrentScaleValue(questionParent));
      }
    });
  }

  function normalizeGradientAngle(angle, fallback) {
    var n = parseInt(angle, 10);

    if (isNaN(n)) {
      return fallback;
    }

    if (n < 0) {
      return 0;
    }

    if (n > 360) {
      return 360;
    }

    return n;
  }

  function sanitizeGradientColor(color, fallback) {
    if (!color || typeof color !== 'string') {
      return fallback;
    }

    var c = color.trim();

    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(c)) {
      return c;
    }

    if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)$/.test(c)) {
      return c;
    }

    return fallback;
  }

  function buildLinearGradientFromState(stateColors, defaults, angle) {
    var start;
    var end;

    stateColors = stateColors || {};
    start = sanitizeGradientColor(stateColors.colorStart, defaults.colorStart);
    end = sanitizeGradientColor(stateColors.colorEnd, defaults.colorEnd);

    return 'linear-gradient(' + angle + 'deg, ' + start + ' 0%, ' + end + ' 100%)';
  }

  function usesLegacyPerStateGradient(appearance) {
    var i;
    var fill;

    if (!appearance) {
      return false;
    }

    for (i = 0; i < DRAGGABLE_GRADIENT_STATES.length; i++) {
      fill = appearance[DRAGGABLE_GRADIENT_STATES[i].legacyFillKey];

      if (fill && fill.useGradient === true) {
        return true;
      }
    }

    return false;
  }

  function getLegacyGlobalAngle(appearance) {
    var i;
    var fill;
    var gc;

    if (!appearance) {
      return 180;
    }

    for (i = 0; i < DRAGGABLE_GRADIENT_STATES.length; i++) {
      fill = appearance[DRAGGABLE_GRADIENT_STATES[i].legacyFillKey];

      if (fill && fill.useGradient === true && fill.gradientColors) {
        gc = fill.gradientColors;

        if (gc.angle !== undefined && gc.angle !== null && gc.angle !== '') {
          return normalizeGradientAngle(gc.angle, 180);
        }
      }
    }

    return 180;
  }

  function formatBorderWidthEm(width, fallback) {
    var n = parseFloat(width);

    if (isNaN(n)) {
      n = fallback;
    }

    if (n < 0) {
      n = 0;
    }

    if (n > BORDER_WIDTH_MAX) {
      n = BORDER_WIDTH_MAX;
    }

    return n + 'em';
  }

  function formatBorderRadiusEm(radius, fallback) {
    var n = parseFloat(radius);

    if (isNaN(n)) {
      n = fallback;
    }

    if (n < 0) {
      n = 0;
    }

    if (n > BORDER_RADIUS_MAX) {
      n = BORDER_RADIUS_MAX;
    }

    return n + 'em';
  }

  function normalizeBorderStyle(style) {
    if (style && VALID_BORDER_STYLES.indexOf(style) !== -1) {
      return style;
    }

    return 'solid';
  }

  function applyDropZoneBorderAppearance(dropZone, appearance, flat) {
    var borderSettings;
    var normal;
    var hover;
    var useBorder;
    var radius;

    dropZone = dropZone || {};
    appearance = appearance || {};
    radius = appearance.dropZoneBorderRadius;

    if (radius === undefined || radius === null || radius === '') {
      radius = dropZone.borderRadius;
    }

    flat.dropZoneBorderRadius = formatBorderRadiusEm(radius, BORDER_RADIUS_DEFAULT);
    useBorder = dropZone.useDropZoneBorder === undefined ?
      true :
      isTruthy(dropZone.useDropZoneBorder);

    flat.useDropZoneBorder = useBorder;
    flat.dropZoneBordersEnabled = useBorder ? '1' : '0';

    if (!useBorder) {
      flat.dropZoneBorderWidth = '0';
      flat.dropZoneBorderStyle = 'none';
      flat.dropZoneHoverBorderStyle = 'none';
      return;
    }

    borderSettings = dropZone.borderSettings || {};
    normal = borderSettings.normal || {};
    hover = borderSettings.hover || {};

    flat.dropZoneBorderWidth = formatBorderWidthEm(borderSettings.borderWidth, 0.1);
    flat.dropZoneBorderStyle = normalizeBorderStyle(normal.borderStyle);
    flat.dropZoneHoverBorderStyle = normalizeBorderStyle(hover.borderStyle || normal.borderStyle);

    if (normal.borderColor !== undefined && normal.borderColor !== null && normal.borderColor !== '') {
      flat.dropZoneBorder = normal.borderColor;
    }
    else if (dropZone.dropZoneBorder !== undefined && dropZone.dropZoneBorder !== null && dropZone.dropZoneBorder !== '') {
      flat.dropZoneBorder = dropZone.dropZoneBorder;
    }

    if (hover.borderColor !== undefined && hover.borderColor !== null && hover.borderColor !== '') {
      flat.dropZoneHoverBorder = hover.borderColor;
    }
    else if (dropZone.dropZoneHoverBorder !== undefined && dropZone.dropZoneHoverBorder !== null && dropZone.dropZoneHoverBorder !== '') {
      flat.dropZoneHoverBorder = dropZone.dropZoneHoverBorder;
    }
  }

  function applyDraggableBorderAppearance(draggable, appearance, flat) {
    var borderSettings;
    var borderColors;
    var useBorder;
    var radius;

    draggable = draggable || {};
    appearance = appearance || {};
    radius = appearance.draggableBorderRadius;

    if (radius === undefined || radius === null || radius === '') {
      radius = draggable.borderRadius;
    }

    flat.draggableBorderRadius = formatBorderRadiusEm(radius, BORDER_RADIUS_DEFAULT);
    useBorder = isTruthy(draggable.useDraggableBorder);
    flat.useDraggableBorder = useBorder;
    flat.draggableBordersEnabled = useBorder ? '1' : '0';

    if (!useBorder) {
      flat.draggableBorderWidth = '0';
      flat.draggableBorderStyle = 'none';
      return;
    }

    borderSettings = draggable.borderSettings || {};
    flat.draggableBorderWidth = formatBorderWidthEm(borderSettings.borderWidth, 0.1);
    flat.draggableBorderStyle = normalizeBorderStyle(borderSettings.borderStyle);

    borderColors = borderSettings.borderColors || borderSettings;
    copyDefinedKeys(flat, borderColors, DRAGGABLE_BORDER_COLOR_KEYS);
  }

  function copyDefinedKeys(target, source, keys) {
    var i;
    var key;
    var value;

    if (!source) {
      return;
    }

    for (i = 0; i < keys.length; i++) {
      key = keys[i];
      value = source[key];

      if (value !== undefined && value !== null && value !== '') {
        target[key] = value;
      }
    }
  }

  function flattenAppearance(appearance) {
    var flat = {};
    var draggable;
    var dropZone;
    var useGradient;
    var gradientBackgrounds;
    var solidBackgrounds;
    var angle;
    var i;
    var spec;
    var stateColors;
    var legacyFill;
    var bgKey;

    if (!appearance) {
      return flat;
    }

    if (appearance.canvasBackground) {
      flat.canvasBackground = appearance.canvasBackground;
    }

    dropZone = appearance.dropZoneColors || appearance;
    copyDefinedKeys(flat, dropZone, DROP_ZONE_BASE_KEYS);
    applyDropZoneBorderAppearance(dropZone, appearance, flat);

    draggable = appearance.draggableColors || appearance;
    copyDefinedKeys(flat, draggable, DRAGGABLE_TEXT_COLOR_KEYS);
    applyDraggableBorderAppearance(draggable, appearance, flat);

    useGradient = isTruthy(draggable.useGradientBackground) || usesLegacyPerStateGradient(appearance);

    if (useGradient) {
      gradientBackgrounds = draggable.gradientBackgrounds || {};
      angle = normalizeGradientAngle(gradientBackgrounds.gradientAngle, getLegacyGlobalAngle(appearance));

      for (i = 0; i < DRAGGABLE_GRADIENT_STATES.length; i++) {
        spec = DRAGGABLE_GRADIENT_STATES[i];
        stateColors = gradientBackgrounds[spec.stateKey];
        legacyFill = appearance[spec.legacyFillKey];

        if ((!stateColors || (!stateColors.colorStart && !stateColors.colorEnd)) &&
            legacyFill && legacyFill.useGradient === true && legacyFill.gradientColors) {
          stateColors = legacyFill.gradientColors;
        }

        flat[spec.solidKey] = buildLinearGradientFromState(stateColors, spec.defaults, angle);
      }
    }
    else {
      solidBackgrounds = draggable.solidBackgrounds || {};

      for (i = 0; i < DRAGGABLE_BACKGROUND_KEYS.length; i++) {
        bgKey = DRAGGABLE_BACKGROUND_KEYS[i];

        if (solidBackgrounds[bgKey] !== undefined && solidBackgrounds[bgKey] !== null && solidBackgrounds[bgKey] !== '') {
          flat[bgKey] = solidBackgrounds[bgKey];
        }
        else if (draggable[bgKey] !== undefined && draggable[bgKey] !== null && draggable[bgKey] !== '') {
          flat[bgKey] = draggable[bgKey];
        }
        else if (appearance[bgKey] !== undefined && appearance[bgKey] !== null && appearance[bgKey] !== '') {
          flat[bgKey] = appearance[bgKey];
        }
      }
    }

    return flat;
  }

  function mergeAppearance(appearance) {
    var merged = {};
    var key;
    var flat;

    for (key in APPEARANCE_DEFAULTS) {
      if (Object.prototype.hasOwnProperty.call(APPEARANCE_DEFAULTS, key)) {
        merged[key] = APPEARANCE_DEFAULTS[key];
      }
    }

    if (!appearance) {
      return merged;
    }

    flat = flattenAppearance(appearance);

    for (key in APPEARANCE_DEFAULTS) {
      if (Object.prototype.hasOwnProperty.call(APPEARANCE_DEFAULTS, key) &&
          flat[key] !== undefined &&
          flat[key] !== null &&
          flat[key] !== '') {
        merged[key] = flat[key];
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
      return merged;
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

    return merged;
  }

  function refreshEditorElementAppearance(questionParent) {
    var taskEditor = H5PEditor.findField('task', questionParent);

    if (taskEditor && typeof taskEditor.refreshAppearanceStyles === 'function') {
      taskEditor.refreshAppearanceStyles();
    }
  }

  function applyEditorAppearance(questionParent) {
    var settings = getSettingsGroup(questionParent);
    var taskWidget = H5PEditor.findField('task', questionParent);
    var appearance;
    var merged;

    if (!taskWidget || !taskWidget.$editor || !taskWidget.$editor.length) {
      return;
    }

    appearance = settings && settings.params && settings.params.appearance;
    merged = applyAppearanceVars(taskWidget.$editor, appearance);

    if (merged && merged.canvasBackground) {
      taskWidget.$editor.css('backgroundColor', merged.canvasBackground);
    }

    refreshEditorElementAppearance(questionParent);
  }

  function setupAppearanceSync(questionParent) {
    var i;
    var j;
    var onAppearanceChange;
    var onToggleChange;
    var legacyFillSuffixes = [
      'useGradient',
      'gradientColors/colorStart',
      'gradientColors/colorEnd',
      'gradientColors/angle'
    ];

    if (!questionParent || questionParent._cfrdAppearanceSyncSetup) {
      return;
    }

    questionParent._cfrdAppearanceSyncSetup = true;

    onAppearanceChange = function () {
      applyEditorAppearance(questionParent);
    };

    onToggleChange = function () {
      applyEditorAppearance(questionParent);
      safeFollowFields(questionParent, APPEARANCE_FOLLOW_PATHS_DROP_ZONE_BORDER, onAppearanceChange);
      safeFollowFields(questionParent, APPEARANCE_FOLLOW_PATHS_SOLID, onAppearanceChange);
      safeFollowFields(questionParent, APPEARANCE_FOLLOW_PATHS_GRADIENT, onAppearanceChange);
      safeFollowFields(questionParent, APPEARANCE_FOLLOW_PATHS_BORDER, onAppearanceChange);
    };

    safeFollowFields(questionParent, APPEARANCE_FOLLOW_PATHS_ALWAYS, onAppearanceChange);
    safeFollowFields(questionParent, APPEARANCE_FOLLOW_PATHS_DROP_ZONE_BORDER, onAppearanceChange);
    safeFollowFields(questionParent, APPEARANCE_FOLLOW_PATHS_SOLID, onAppearanceChange);
    safeFollowFields(questionParent, APPEARANCE_FOLLOW_PATHS_GRADIENT, onAppearanceChange);
    safeFollowFields(questionParent, APPEARANCE_FOLLOW_PATHS_BORDER, onAppearanceChange);
    safeBindFieldInputs(questionParent, 'settings/appearance/dropZoneBorderRadius', onAppearanceChange);
    safeBindFieldInputs(questionParent, 'settings/appearance/draggableBorderRadius', onAppearanceChange);

    safeFollowField(
      questionParent,
      'settings/appearance/dropZoneColors/useDropZoneBorder',
      onToggleChange
    );
    safeFollowField(
      questionParent,
      'settings/appearance/draggableColors/useGradientBackground',
      onToggleChange
    );
    safeFollowField(
      questionParent,
      'settings/appearance/draggableColors/useDraggableBorder',
      onToggleChange
    );

    for (i = 0; i < DRAGGABLE_GRADIENT_STATES.length; i++) {
      for (j = 0; j < legacyFillSuffixes.length; j++) {
        safeFollowField(
          questionParent,
          'settings/appearance/' + DRAGGABLE_GRADIENT_STATES[i].legacyFillKey + '/' + legacyFillSuffixes[j],
          onAppearanceChange
        );
      }
    }
  }

  function setupTaskSizeScaleSync(questionParent) {
    if (!questionParent || questionParent._cfrdTaskSizeSyncSetup) {
      return;
    }

    questionParent._cfrdTaskSizeSyncSetup = true;

    H5PEditor.followField(questionParent, 'settings/useScaledTaskSize', function () {
      // followField passes field.params (empty for Boolean); read .value / DOM.
      var enabled = getCurrentUseScaledValue(questionParent);
      bindUseScaledCheckboxChange(questionParent);
      updateTaskSizeScaleUI(questionParent, enabled);

      if (isTruthy(enabled)) {
        applyScaleToSizeField(questionParent, getCurrentScaleValue(questionParent));
      }
    });

    H5PEditor.followField(questionParent, 'settings/taskSizeScale', function () {
      // followField passes field.params (empty for Select); read .value / DOM.
      var scaleValue = getCurrentScaleValue(questionParent);
      bindScaleSelectChange(questionParent);
      bindUseScaledCheckboxChange(questionParent);
      updateTaskSizeScaleUI(questionParent);

      if (isScaledModeEnabled(questionParent)) {
        applyScaleToSizeField(questionParent, scaleValue);
      }
    });
  }

  /**
   * Bind scale UI even if an earlier ready callback aborted the editor queue.
   * Retries briefly until the Settings fields exist in the DOM.
   *
   * @param {Object} questionParent
   */
  function scheduleTaskSizeScaleBind(questionParent) {
    var attempts = 0;
    var maxAttempts = 20;

    function tryBind() {
      var scaleField;
      var useScaledField;
      var sizeField;
      var enabled;

      attempts += 1;
      scaleField = getScaleField(questionParent);
      useScaledField = getUseScaledField(questionParent);
      sizeField = getSizeField(questionParent);

      if (!scaleField || !useScaledField || !sizeField || !sizeField.$inputs) {
        if (attempts < maxAttempts) {
          setTimeout(tryBind, 50);
        }
        return;
      }

      bindScaleSelectChange(questionParent);
      bindUseScaledCheckboxChange(questionParent);
      enabled = getCurrentUseScaledValue(questionParent);
      updateTaskSizeScaleUI(questionParent, enabled);

      if (isTruthy(enabled)) {
        applyScaleToSizeField(questionParent, getCurrentScaleValue(questionParent));
      }
      else if (sizeField.params && sizeField.params.width !== undefined) {
        notifyTaskWidgetSize(
          questionParent,
          parseInt(sizeField.params.width, 10),
          parseInt(sizeField.params.height, 10)
        );
      }
      else if (sizeField.$inputs && sizeField.$inputs.length >= 2) {
        notifyTaskWidgetSize(
          questionParent,
          parseInt(sizeField.$inputs.eq(0).val(), 10),
          parseInt(sizeField.$inputs.eq(1).val(), 10)
        );
      }
    }

    setTimeout(tryBind, 0);
    setTimeout(tryBind, 100);
  }

  function scheduleApplyEditorAppearance(questionParent) {
    setTimeout(function () {
      applyEditorAppearance(questionParent);
    }, 0);
    setTimeout(function () {
      applyEditorAppearance(questionParent);
    }, 150);
  }

  function patchDragQuestionWidget() {
    var Original = H5PEditor.DragQuestionCFRD;
    var originalSetActive;

    if (!Original || Original._cfrdSizeSyncPatched) {
      return;
    }

    H5PEditor.DragQuestionCFRD = function (parent, field, params, setValue) {
      Original.call(this, parent, field, params, setValue);
      setupTaskSizeScaleSync(parent);
      scheduleTaskSizeScaleBind(parent);
      setupAppearanceSync(parent);
    };

    H5PEditor.DragQuestionCFRD.prototype = Original.prototype;
    originalSetActive = Original.prototype.setActive;
    H5PEditor.DragQuestionCFRD.prototype.setActive = function () {
      var parent = this.parent;

      originalSetActive.call(this);
      // Do not reschedule scale bind here: applyScale → setSize → setActive loops.
      scheduleApplyEditorAppearance(parent);
    };

    H5PEditor.DragQuestionCFRD.cfrdApplyEditorAppearance = applyEditorAppearance;
    H5PEditor.DragQuestionCFRD._cfrdSizeSyncPatched = true;
    H5PEditor.widgets.dragQuestionCFRD = H5PEditor.DragQuestionCFRD;
  }

  patchDragQuestionWidget();

})(H5P.jQuery);
