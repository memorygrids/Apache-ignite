/* @java.file.header */

/*  _________        _____ __________________        _____
 *  __  ____/___________(_)______  /__  ____/______ ____(_)_______
 *  _  / __  __  ___/__  / _  __  / _  / __  _  __ `/__  / __  __ \
 *  / /_/ /  _  /    _  /  / /_/ /  / /_/ /  / /_/ / _  /  _  / / /
 *  \____/   /_/     /_/   \_,__/   \____/   \__,_/  /_/   /_/ /_/
 */

package org.gridgain.grid.p2p;

import org.apache.ignite.*;
import org.apache.ignite.compute.*;
import org.apache.ignite.configuration.*;
import org.apache.ignite.resources.*;
import org.gridgain.testframework.junits.common.*;

import java.io.*;
import java.util.*;

/**
 * Test to make sure that if job executes on the same node, it reuses the same class loader as task.
 */
@SuppressWarnings({"ProhibitedExceptionDeclared"})
@GridCommonTest(group = "P2P")
public class GridP2PJobClassLoaderSelfTest extends GridCommonAbstractTest {
    /**
     * Current deployment mode. Used in {@link #getConfiguration(String)}.
     */
    private IgniteDeploymentMode depMode;

    /** {@inheritDoc} */
    @Override protected IgniteConfiguration getConfiguration(String gridName) throws Exception {
        IgniteConfiguration cfg = super.getConfiguration(gridName);

        cfg.setDeploymentMode(depMode);

        return cfg;
    }

    /**
     * Process one test.
     * @param depMode deployment mode.
     * @throws Exception if error occur.
     */
    private void processTest(IgniteDeploymentMode depMode) throws Exception {
        this.depMode = depMode;

        try {
            Ignite ignite = startGrid(1);

            ignite.compute().execute(Task.class, null);
        }
        finally {
            stopGrid(1);
        }
    }

    /**
     * Test GridDeploymentMode.ISOLATED mode.
     *
     * @throws Exception if error occur.
     */
    public void testPrivateMode() throws Exception {
        processTest(IgniteDeploymentMode.PRIVATE);
    }

    /**
     * Test GridDeploymentMode.ISOLATED mode.
     *
     * @throws Exception if error occur.
     */
    public void testIsolatedMode() throws Exception {
        processTest(IgniteDeploymentMode.ISOLATED);
    }

    /**
     * Test GridDeploymentMode.CONTINOUS mode.
     *
     * @throws Exception if error occur.
     */
    public void testContinuousMode() throws Exception {
        processTest(IgniteDeploymentMode.CONTINUOUS);
    }

    /**
     * Test GridDeploymentMode.SHARED mode.
     *
     * @throws Exception if error occur.
     */
    public void testSharedMode() throws Exception {
        processTest(IgniteDeploymentMode.SHARED);
    }

    /**
     * Simple resource.
     */
    public static class UserResource {
        // No-op.
    }

    /**
     * Task that will always fail due to non-transient resource injection.
     */
    public static class Task extends ComputeTaskSplitAdapter<Object, Object> {
        /**
         * ClassLoader loaded task.
         */
        private static ClassLoader ldr;

        /** {@inheritDoc} */
        @Override protected Collection<? extends ComputeJob> split(int gridSize, Object arg) throws IgniteCheckedException {
            assert gridSize == 1;

            ldr = getClass().getClassLoader();

            return Collections.singletonList(new ComputeJobAdapter() {
                    /** {@inheritDoc} */
                    @SuppressWarnings({"ObjectEquality"})
                    public Serializable execute() throws IgniteCheckedException {
                        assert getClass().getClassLoader() == ldr;

                        return null;
                    }
                });
        }

        /** {@inheritDoc} */
        @Override public Object reduce(List<ComputeJobResult> results) throws IgniteCheckedException {
            // Nothing to reduce.
            return null;
        }
    }
}
