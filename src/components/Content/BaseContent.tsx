import type { ReactNode } from 'react';
import { useToken } from '@/hooks/useToken';
import Forbidden from '@/pages/403';

interface Props {
  isPermission?: boolean;
  children: ReactNode;
}

function BaseContent(props: Props) {
  const { isPermission, children } = props;
  const [getToken] = useToken();
  const showForbidden = isPermission === false && Boolean(getToken());

  return (
    <>
      {isPermission !== false && (
        <div id="content" className="p-10px">
          {children}
        </div>
      )}
      {showForbidden && (
        <div className="h-full p-10px box-border overflow-auto">
          <Forbidden />
        </div>
      )}
    </>
  );
}

export default BaseContent;
