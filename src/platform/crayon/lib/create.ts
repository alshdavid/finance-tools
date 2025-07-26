import * as genString from '../platform/gen-string/index.ts' 
import { History } from '../platform/history/index.ts'
import { Location } from "../platform/locator/index.ts";
import { RouteMap } from "../platform/route-map/index.ts";
import { getSharedState, SharedState, setSharedState } from '../platform/shared-state/index.ts';
import { Router, RouterEventType } from "../platform/router/index.ts";

/*
  This is the entrypoint.
  It bootstraps dependencies, creates
  the router and handles teardown
*/
export const create = (
  id = genString.ofLength(10),
  _window: Window = window,
  sharedState?: SharedState,
): Router => {
  /*
    SharedState lives on the window object and allows
    for routers to talk to each other
  */
  if (sharedState === undefined) {
    sharedState = getSharedState(_window)
  }
  if (sharedState === undefined) {
    const history = new History(_window)
    sharedState = new SharedState(history)
    setSharedState(sharedState)
  }
  const history = sharedState.history
  const routeMap = new RouteMap()
  const locator = new Location(_window)
  const router = new Router(
    id, 
    locator, 
    routeMap, 
    history,
    sharedState.events
  )
  // Add the router to the shared state
  sharedState.addRouter(router)
  onRouterDestroy(router, sharedState)
  
  return router
}

const onRouterDestroy = async (
  router: Router, 
  sharedState: SharedState,
): Promise<void> => {
  await sharedState.events.first(event =>
    event.type === RouterEventType.Destroyed && 
    event.id === router.id
  )
  sharedState!.removeRouter(router)
}
