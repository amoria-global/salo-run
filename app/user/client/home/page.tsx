import ClientHome from '@/app/pages/client/home';
import RoleHomeSwitch from '@/app/components/glass/home/RoleHomeSwitch';

export default function Page() {
  return (
    <RoleHomeSwitch role="client">
      <ClientHome />
    </RoleHomeSwitch>
  );
}
