import { Icon } from '@iconify/react';
import { Tooltip } from 'antd';

function Github() {
  /** 跳转Github */
  const goGithub = () => {
    window.open('https://github.com/southliu/react-admin');
  };

  return (
    <Tooltip title="Github">
      <div onClick={goGithub}>
        <Icon
          className="flex items-center justify-center text-lg mr-3 cursor-pointer"
          icon="mdi:github"
        />
      </div>
    </Tooltip>
  );
}

export default Github;
