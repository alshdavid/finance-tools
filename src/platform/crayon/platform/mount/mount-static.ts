import * as element from '../element/index.ts'
import { getRouteTargets } from "./get-route-targets.ts";
import { Mounter } from './mounter.ts';
import { ClassNameStates } from './make-class-names.ts';

export const staticMount = async (
  states: ClassNameStates,
  incoming: any,
  mounter: Mounter,
  name: string,
): Promise<void> => {
  await mounter.push(incoming)
  const { leaving, entering } = getRouteTargets(mounter.selector)

  // Add classes to entering element
  element.addClassNames(entering, [name])
  element.waitForElements(entering)

  // First load
  if (leaving === undefined) {
    element.addClassNames(entering, [states.enterDone])
    return
  }
  
  await mounter.shift()
}

