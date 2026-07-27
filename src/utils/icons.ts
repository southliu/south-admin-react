import { addCollection } from '@iconify/react';
// 离线图标集：项目用到的全部 prefix 全量打包，避免运行时依赖 api.iconify.design（线上网络不可达会导致 <Icon> 空白）
import antDesign from '@iconify-json/ant-design/icons.json';
import cil from '@iconify-json/cil/icons.json';
import gg from '@iconify-json/gg/icons.json';
import gridicons from '@iconify-json/gridicons/icons.json';
import iconPark from '@iconify-json/icon-park/icons.json';
import iconParkOutline from '@iconify-json/icon-park-outline/icons.json';
import ion from '@iconify-json/ion/icons.json';
import mdi from '@iconify-json/mdi/icons.json';
import uil from '@iconify-json/uil/icons.json';

// 静态注册：在应用渲染前完成，菜单/页面内的 <Icon> 即可离线渲染
addCollection(antDesign);
addCollection(cil);
addCollection(gg);
addCollection(gridicons);
addCollection(iconPark);
addCollection(iconParkOutline);
addCollection(ion);
addCollection(mdi);
addCollection(uil);
