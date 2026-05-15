import { ClipMode, PointCloudOctree, PointColorType, PointShape, PointSizeType } from '../src';
import { Viewer } from './viewer';

require('./main.css');

const targetEl: HTMLDivElement = document.createElement('div');
targetEl.className = 'container';
document.body.appendChild(targetEl);

const controlsEl: HTMLDivElement = document.createElement('div');
controlsEl.className = 'controls';
document.body.appendChild(controlsEl);

const viewer: Viewer = new Viewer();
viewer.initialize(targetEl);

interface PointCloudsConfig {
  file: string;
  url: string;
  version: 'v1' | 'v2' | 'splats';
}

const examplePointClouds: PointCloudsConfig[] = [
  {
    file: 'cloud.js',
    url: 'https://raw.githubusercontent.com/potree/potree/develop/pointclouds/lion_takanawa/',
    version: 'v1',
  },
  {
    file: 'metadata.json',
    url: 'https://test-pix4d-cloud-eu-central-1.s3.eu-central-1.amazonaws.com/lion_takanawa_converted/',
    version: 'v2',
  },
];

interface PointClouds {
  [key: string]: PointCloudOctree | undefined;
}

interface LoadedState {
  [key: string]: boolean;
}

interface LoadingState {
  [key: string]: boolean;
}

const pointClouds: PointClouds = {
  v1: undefined,
  v2: undefined,
  splats: undefined,
};

const loaded: LoadedState = {
  v1: false,
  v2: false,
  splats: false,
};

const loading: LoadingState = {
  v1: false,
  v2: false,
  splats: false,
};

function createButton(text: string, onClick: (e: MouseEvent) => void): HTMLButtonElement {
  const button: HTMLButtonElement = document.createElement('button');
  button.textContent = text;
  button.addEventListener('click', onClick);
  return button;
}

function createStatus(): HTMLSpanElement {
  const status = document.createElement('span');
  status.className = 'load-status';
  return status;
}

function createSlider(version: string): HTMLInputElement {
  const slider: HTMLInputElement = document.createElement('input');
  slider.type = 'range';
  slider.min = '10000';
  slider.max = '1000000';
  slider.value = '1000000';
  slider.className = 'budget-slider';
  slider.title = 'Point budget';
  slider.addEventListener('change', () => {
    const cloud = pointClouds[version];
    if (!cloud) {
      return;
    }
    cloud.potree.pointBudget = parseInt(slider.value, 10);
    viewer.update(0);
    console.log(cloud.potree.pointBudget);
  });
  return slider;
}

function createPointSizeSlider(version: string): HTMLInputElement {
  const slider: HTMLInputElement = document.createElement('input');
  slider.type = 'range';
  slider.min = '0.05';
  slider.max = '16';
  slider.step = '0.05';
  slider.value = '4';
  slider.className = 'point-size-slider';
  slider.title = 'Point size';
  slider.addEventListener('input', () => {
    const cloud = pointClouds[version];
    if (!cloud) {
      return;
    }

    const size = parseFloat(slider.value);
    cloud.material.size = size;
    viewer.setDebugPointSize(cloud, size);
    viewer.update(0);
  });
  return slider;
}

function createSelect<T extends string>(
  className: string,
  title: string,
  options: Array<{ label: string; value: T }>,
  onChange: (value: T) => void,
): HTMLSelectElement {
  const select = document.createElement('select');
  select.className = className;
  select.title = title;

  for (const option of options) {
    const element = document.createElement('option');
    element.value = option.value;
    element.textContent = option.label;
    select.appendChild(element);
  }

  select.addEventListener('change', () => {
    onChange(select.value as T);
  });

  return select;
}

function applyMaterialMode(version: string, mode: string): void {
  const cloud = pointClouds[version];
  if (!cloud) {
    return;
  }

  const colorTypes: Record<string, PointColorType> = {
    classification: PointColorType.CLASSIFICATION,
    height: PointColorType.HEIGHT,
    intensity: PointColorType.INTENSITY,
    intensityGradient: PointColorType.INTENSITY_GRADIENT,
    lod: PointColorType.LOD,
    rgb: PointColorType.RGB,
    rgbHeight: PointColorType.RGB_HEIGHT,
  };

  cloud.material.pointColorType = colorTypes[mode] ?? PointColorType.RGB;
  viewer.update(0);
}

function applyPointSizeType(version: string, mode: string): void {
  const cloud = pointClouds[version];
  if (!cloud) {
    return;
  }

  const sizeTypes: Record<string, PointSizeType> = {
    adaptive: PointSizeType.ADAPTIVE,
    attenuated: PointSizeType.ATTENUATED,
    fixed: PointSizeType.FIXED,
  };

  cloud.material.pointSizeType = sizeTypes[mode] ?? PointSizeType.FIXED;
  viewer.update(0);
}

function applyPointShape(version: string, mode: string): void {
  const cloud = pointClouds[version];
  if (!cloud) {
    return;
  }

  const shapes: Record<string, PointShape> = {
    circle: PointShape.CIRCLE,
    paraboloid: PointShape.PARABOLOID,
    square: PointShape.SQUARE,
  };

  cloud.material.shape = shapes[mode] ?? PointShape.SQUARE;
  viewer.update(0);
}

function setupPointCloud(
  version: 'v1' | 'v2' | 'splats',
  file: string,
  url: string,
  setStatus: (message: string) => void,
): void {
  if (loaded[version] || loading[version]) {
    return;
  }
  loading[version] = true;
  setStatus('Loading...');

  //TODO: check for mobile, not noly IOS
  function isIOS() {
    const ua = navigator.userAgent;
    return ua.indexOf('iPhone') > 0 || ua.indexOf('iPad') > 0;
  }

  viewer
    .load(file, url, version === 'splats' ? 'v2' : version, !isIOS())
    .then((pco) => {
      pointClouds[version] = pco;
      loaded[version] = true;
      setStatus('Loaded');
      pco.material.size = 4.0;
      pco.material.pointSizeType = PointSizeType.FIXED;
      pco.material.pointColorType = PointColorType.RGB;

      pco.material.clipMode = ClipMode.DISABLED;
      pco.showBoundingBox = true;

      viewer.add(pco);
      viewer.fitToPointCloud(pco);
      viewer.trackPointCloudStatus(pco, setStatus);
    })
    .catch((err) => {
      loaded[version] = false;
      const message = err instanceof Error ? err.message : String(err);
      setStatus(`Error: ${message}`);
      console.error(err);
    })
    .finally(() => {
      loading[version] = false;
    });
}

function setupUI(cfg: PointCloudsConfig): void {
  const updateBtn = createButton('Update', (e: MouseEvent) => {
    e.stopPropagation();
    viewer.enableUpdate = !viewer.enableUpdate;
    updateBtn.style.backgroundColor = viewer.enableUpdate ? '#00ff00' : '#ff0000';
  });

  updateBtn.style.backgroundColor = '#00ff00';

  const materialBtn = createButton('Debug fallback', (e: MouseEvent) => {
    e.stopPropagation();
    viewer.setUseDebugMaterialFallback(!viewer.useDebugMaterialFallback);
    materialBtn.textContent = viewer.useDebugMaterialFallback
      ? 'Debug fallback'
      : 'Shader material';
    materialBtn.style.backgroundColor = viewer.useDebugMaterialFallback ? '#ffcc00' : '#00ff00';
  });

  materialBtn.style.backgroundColor = '#00ff00';

  const slider = createSlider(cfg.version);
  const pointSizeSlider = createPointSizeSlider(cfg.version);
  const colorModeSelect = createSelect(
    'material-mode-select',
    'Point color mode',
    [
      { label: 'RGB', value: 'rgb' },
      { label: 'Height', value: 'height' },
      { label: 'RGB + height', value: 'rgbHeight' },
      { label: 'Intensity', value: 'intensity' },
      { label: 'Intensity gradient', value: 'intensityGradient' },
      { label: 'Classification', value: 'classification' },
      { label: 'LOD', value: 'lod' },
    ],
    (mode) => applyMaterialMode(cfg.version, mode),
  );
  const sizeModeSelect = createSelect(
    'size-mode-select',
    'Point size mode',
    [
      { label: 'Fixed size', value: 'fixed' },
      { label: 'Attenuated size', value: 'attenuated' },
      { label: 'Adaptive size', value: 'adaptive' },
    ],
    (mode) => applyPointSizeType(cfg.version, mode),
  );
  const shapeSelect = createSelect(
    'shape-select',
    'Point shape',
    [
      { label: 'Square', value: 'square' },
      { label: 'Circle', value: 'circle' },
      { label: 'Paraboloid', value: 'paraboloid' },
    ],
    (mode) => applyPointShape(cfg.version, mode),
  );
  const status = createStatus();
  const setStatus = (message: string) => {
    status.textContent = message;
  };

  const unloadBtn = createButton('Unload', () => {
    if (!loaded[cfg.version]) {
      return;
    }

    const pointCloud = pointClouds[cfg.version];
    if (!pointCloud) {
      return;
    }
    viewer.disposePointCloud(pointCloud);
    loaded[cfg.version] = false;
    pointClouds[cfg.version] = undefined;

    viewer.enableUpdate = true;
    updateBtn.style.backgroundColor = '#00ff00';
    setStatus('Unloaded');
  });

  const loadBtn = createButton('Load', (e: MouseEvent) => {
    e.stopPropagation();
    setupPointCloud(cfg.version, cfg.file, cfg.url, setStatus);
  });

  const btnContainer: HTMLDivElement = document.createElement('div');
  btnContainer.className = `btn-container btn-container-${cfg.version}`;
  controlsEl.appendChild(btnContainer);
  btnContainer.appendChild(unloadBtn);
  btnContainer.appendChild(loadBtn);
  btnContainer.append(updateBtn);
  btnContainer.append(materialBtn);
  btnContainer.appendChild(slider);
  btnContainer.appendChild(pointSizeSlider);
  btnContainer.appendChild(colorModeSelect);
  btnContainer.appendChild(sizeModeSelect);
  btnContainer.appendChild(shapeSelect);
  btnContainer.appendChild(status);
}

examplePointClouds.forEach(setupUI);
